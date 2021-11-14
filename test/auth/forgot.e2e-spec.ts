import * as faker from 'faker';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/user.entity';
import { HelperService } from '../../src/common/helper/helper.service';

describe('Auth -> Forgot (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;

	let testUser: User;
	let password: string;
	const phone = faker.phone.phoneNumber('+447425######');
	let verifyCode: string;

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
		testUser.phone = phone;
		await connection.getRepository(User).save({
			...testUser,
			password: await bcrypt.hash(password, 12),
		});

		const codeRequestMutation = `
			mutation requestCode($phone: String!) {
				requestCode(phone: $phone)
			}
		`;

		const codeVerifyMutation = `
			mutation verifyCode($code: String!) {
				verifyCode(code: $code)
			}
		`;

		await request(app.getHttpServer()).post('/graphql').send({
			query: codeRequestMutation,
			variables: {
				phone,
			},
		});

		const codes = await connection.query('SELECT * FROM codes');

		({
			body: {
				data: { verifyCode },
			},
		} = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: codeVerifyMutation,
				variables: {
					code: codes[0].code,
				},
			}));
	});

	// afterEach(async () => {
	// 	await connection.getRepository(User).remove(testUser);
	// });

	afterAll(async () => {
		await app.close();
	});

	const query = `
	mutation reset($password: String!, $verification: String!, $phone: String!) {
		resetPassword(password: $password, verification: $verification, phone: $phone) {
			accessToken
			refreshToken
		}
	}
	`;

	const loginQuery = `
	mutation login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			accessToken
			refreshToken
		}
	}
	`;

	it('returns a token when reset and changes password', async () => {
		const newPassword = faker.internet.password();
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query,
				variables: {
					password: newPassword,
					phone,
					verification: verifyCode,
				},
			})
			.expect(200);

		const { accessToken, refreshToken } = res.body.data.resetPassword;
		expect(accessToken).toMatch(
			/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
		);
		expect(refreshToken).toMatch(
			/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
		);

		// Make sure token saved in DB
		const tokens = await connection.query('SELECT * FROM tokens');
		expect(tokens[0].token).toEqual(refreshToken);

		const loginRes = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: loginQuery,
				variables: {
					email: testUser.email,
					password: newPassword,
				},
			})
			.expect(200);

		const {
			accessToken: loginAccessToken,
			refreshToken: loginRefreshToken,
		} = loginRes.body.data.login;

		expect(loginAccessToken).toMatch(
			/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
		);
		expect(loginRefreshToken).toMatch(
			/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
		);
	});

	it('returns null with an invalid verification code', async () => {
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query,
				variables: {
					phone,
					verification: '',
					password,
				},
			});

		expect(res.body.data).toEqual(null);
	});
});
