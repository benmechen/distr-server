import * as faker from 'faker';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/user.entity';
import { HelperService } from '../../src/common/helper/helper.service';

describe('Auth -> Login (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;

	let testUser: User;
	let password: string;

	const helpersService = new HelperService();

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		connection = getConnection();
	});

	beforeEach(async () => {
		if (process.env.NODE_ENV === 'test') {
			// Drop & recreate tables
			await connection.synchronize(true);
		}
		password = faker.internet.password();
		testUser = helpersService.createTestUser();
		await connection.getRepository(User).save({
			...testUser,
			password: await bcrypt.hash(password, 12),
		});
	});

	// afterEach(async () => {
	// 	await connection.getRepository(User).remove(testUser);
	// });

	afterAll(async () => {
		await app.close();
	});

	const query = `
	mutation login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			accessToken
			refreshToken
		}
	}
	`;

	it('returns a token with a valid email and password', async () => {
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query,
				variables: {
					email: testUser.email,
					password,
				},
			})
			.expect(200);

		const { accessToken, refreshToken } = res.body.data.login;
		expect(accessToken).toMatch(
			/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
		);
		expect(refreshToken).toMatch(
			/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
		);

		// Make sure token saved in DB
		const tokens = await connection.query('SELECT * FROM tokens');
		expect(tokens[0].token).toEqual(refreshToken);
	});

	it('returns null with a bad email', async () => {
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query,
				variables: {
					email: faker.internet.email(),
					password,
				},
			})
			.expect(200);

		const token = res.body.data.login;
		expect(token).toEqual(null);
	});

	it('returns null with a bad password', async () => {
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query,
				variables: {
					email: testUser.email,
					password: faker.internet.password(),
				},
			})
			.expect(200);

		const token = res.body.data.login;
		expect(token).toEqual(null);
	});
});
