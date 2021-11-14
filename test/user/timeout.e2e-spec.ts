import * as faker from 'faker';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/user.entity';
import { HelperService } from '../../src/common/helper/helper.service';

describe('User -> Timeout (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;

	let testUser: User;
	let password: string;
	let accessToken: string;

	const helpersService = new HelperService();

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		// Use class validator
		app.useGlobalPipes(new ValidationPipe());
		await app.init();

		connection = getConnection();
	});

	const doLogin = async (email: string | null = null) => {
		return request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: `
                mutation login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        accessToken
                    }
                }
                `,
				variables: {
					email: email || testUser.email,
					password,
				},
			})
			.expect(200);
	};

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

		const res = await doLogin();
		({ accessToken } = res.body.data.login);
	});

	afterAll(async () => {
		await app.close();
	});

	const userTimeoutMutation = `
	mutation setTimeout($endDate: DateTime!) {
		userSetTimeout(endDate: $endDate) {
			timeout
		}
	}
    `;

	const adminRemoveTimeout = `
        mutation removeTimeout($id: String!) {
            adminUserRemoveTimeout(id: $id) {
                timeout
            }
        }
    `;

	const adminSetTimeout = `
        mutation setTimeout($id: String!, $endDate: DateTime!) {
            adminUserSetTimeout(id: $id, endDate: $endDate) {
                timeout
            }
        }
    `;

	it('sets a timeout for a user and disallows future login', async () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: userTimeoutMutation,
				variables: {
					endDate: tomorrow.toISOString(),
				},
			})
			.expect(200);

		const user = res.body.data.userSetTimeout;

		expect(user.timeout).toEqual(tomorrow.toISOString());
		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');
		const timeout = new Date(users[0].timeout);
		expect(timeout.toISOString()).toEqual(tomorrow.toISOString());

		const newLoginRes = await doLogin();

		expect(newLoginRes.body.data.login).toBeFalsy();
		expect(newLoginRes.body.errors?.length).toEqual(1);
	});

	it('fails to set a timeout for a user in the past', async () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: userTimeoutMutation,
				variables: {
					endDate: yesterday.toISOString(),
				},
			})
			.expect(200);

		expect(res.body.data.userSetTimeout).toBeFalsy();
		expect(res.body.errors?.length).toEqual(1);
	});

	it('removes a timeout for a user and allows future login', async () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const secondTestUser = helpersService.createTestUser();
		await connection.getRepository(User).save({
			...secondTestUser,
			timeout: tomorrow.toISOString(),
			password: await bcrypt.hash(password, 12),
		});

		await connection.query(
			`UPDATE users SET role = 'ADMIN' WHERE id = '${testUser.id}'`,
		);

		const failLoginRes = await doLogin(secondTestUser.email);

		expect(failLoginRes.body.data.login).toBeFalsy();
		expect(failLoginRes.body.errors?.length).toEqual(1);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: adminRemoveTimeout,
				variables: {
					id: secondTestUser.id,
				},
			})
			.expect(200);

		const user = res.body.data.adminUserRemoveTimeout;
		expect(user.timeout).toBeFalsy();

		await new Promise((r) => setTimeout(r, 2000));

		const users = await connection.query(
			`SELECT * FROM users WHERE id = '${secondTestUser.id}'`,
		);

		expect(users[0].timeout).toBeFalsy();

		const successLoginRes = await doLogin(secondTestUser.email);

		expect(successLoginRes.body.data.login).toBeTruthy();
		expect(successLoginRes.body.errors).toBeFalsy();
	});

	it('does not allow a non admin user to remove a timeout', async () => {
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: adminRemoveTimeout,
				variables: {
					id: testUser.id,
				},
			})
			.expect(200);

		expect(res.body.errors?.length).toEqual(1);
		expect(res.body.data.adminUserRemoveTimeout).toBeFalsy();
	});

	it("allows an admin user to set an account's timeout", async () => {
		const secondTestUser = helpersService.createTestUser();
		await connection.getRepository(User).save({
			...secondTestUser,
			password: await bcrypt.hash(password, 12),
		});

		const successLoginRes = await doLogin(secondTestUser.email);

		expect(successLoginRes.body.data.login).toBeTruthy();
		expect(successLoginRes.body.errors).toBeFalsy();

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		await connection.query(
			`UPDATE users SET role = 'ADMIN' WHERE id = '${testUser.id}'`,
		);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: adminSetTimeout,
				variables: {
					id: secondTestUser.id,
					endDate: tomorrow.toISOString(),
				},
			})
			.expect(200);

		const user = res.body.data.adminUserSetTimeout;
		expect(user.timeout).toEqual(tomorrow.toISOString());

		const users = await connection.query(
			`SELECT * FROM users WHERE id = '${secondTestUser.id}'`,
		);
		const timeout = new Date(users[0].timeout);
		expect(timeout.toISOString()).toEqual(tomorrow.toISOString());

		const failLoginRes = await doLogin(secondTestUser.email);
		expect(failLoginRes.body.data.login).toBeFalsy();
		expect(failLoginRes.body.errors?.length).toEqual(1);
	});

	it("does not allow a non admin user to set an account's timeout", async () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: adminSetTimeout,
				variables: {
					id: testUser.id,
					endDate: tomorrow.toISOString(),
				},
			})
			.expect(200);

		expect(res.body.data.adminUserSetTimeout).toBeFalsy();
		expect(res.body.errors?.length).toEqual(1);
	});
});
