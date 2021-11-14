import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/user.entity';
import { Token } from '../../src/common/token/token.entity';
import { TestUtils } from '../utils';
import { HelperService } from '../../src/common/helper/helper.service';

describe('Auth -> Logout (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;

	let testUser: User;
	let token: Token;

	const helpersService = new HelperService();

	const key = 'public_key';

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		connection = getConnection();
		await TestUtils.recreateDatabase();
	});

	beforeEach(async () => {
		if (process.env.NODE_ENV === 'test') {
			// Drop & recreate tables
			await connection.synchronize(true);
		}
		testUser = {
			...helpersService.createTestUser(),
			password: await bcrypt.hash(faker.internet.password(), 12),
		};
		await connection.getRepository(User).save(testUser);
		token = Token.of({
			token: jwt.sign(
				{
					sub: testUser.id,
					email: testUser.email,
					type: 'refresh',
				},
				key,
			),
			user: testUser,
		});
		await connection.getRepository(Token).save(token);
	});

	afterAll(async () => {
		await app.close();
	});

	const query = `
	mutation logout($token: String!) {
		logout(token: $token)
	}
	`;

	it('removes the token from the tokens list', async () => {
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query,
				variables: {
					token: token.token,
				},
			})
			.expect(200);
		expect(res.body.data.logout).toEqual(token.token);

		const tokens = await connection.getRepository(Token).find();
		expect(tokens.length).toEqual(0);
	});
});
