import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User, UserRole } from '../../src/user/user.entity';
import { HelperService } from '../../src/common/helper/helper.service';

const formatInput = (input: any) => {
	delete input.id;
	delete input.created;
	delete input.updated;
	delete input.role;
	delete input.locked;
	delete input.loginAttempts;
	delete input.timeout;
	delete input.active;
	delete input.watchedManagers;
	delete input.watchedPlayers;
	delete input.addressLine1;
	delete input.addressLine2;
	delete input.addressPostal;
	delete input.addressCity;
	delete input.addressCounty;
	delete input.addressCountry;
	delete input.balance;
	return input;
};

describe('User -> Create (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;

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

	afterAll(async () => {
		await app.close();
	});

	const userCreateMutation = `
	mutation createUser($input: UserCreateInput!) {
		userCreate(input: $input) {
			id
            firstName
            lastName
            email
            phone
            role
            tokens {
                accessToken
                refreshToken
			}
		}
	}
    `;

	const adminUserCreateMutation = `
	mutation createUser($input: AdminUserCreateInput!) {
		adminUserCreate(input: $input) {
			id
            firstName
            lastName
            email
            phone
            role
            tokens {
                accessToken
                refreshToken
			}
		}
	}
    `;

	const userQuery = `
    {
        me {
            id
        }
    }
    `;

	it('creates a user', async () => {
		const input = formatInput(helpersService.createTestUser());

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...input,
						tos: true,
						verification: verifyCode,
						phone,
					},
				},
			})
			.expect(200);

		const user = res.body.data.userCreate;
		delete user.tokens;
		delete user.address;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, password, ...compareInput } = input;
		expect(user).toEqual(
			expect.objectContaining({
				...compareInput,
				role: 'CUSTOMER',
				phone,
			}),
		);

		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');
		expect(users[0].id).toEqual(user.id);
		expect(users[0].tos).not.toBe(null);
	});

	it('returns a valid set of tokens', async () => {
		const input = formatInput(helpersService.createTestUser());

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...input,
						tos: true,
						verification: verifyCode,
						phone,
					},
				},
			})
			.expect(200);

		const { id, tokens } = res.body.data.userCreate;
		expect(tokens).not.toBeNull();

		// Check tokens can be used
		const userRes = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${tokens.accessToken}`)
			.send({
				query: userQuery,
			})
			.expect(200);

		const { me } = userRes.body.data;
		expect(me.id).toEqual(id);
	});

	it('does not create a user with an existing email', async () => {
		const input = helpersService.createTestUser() as any;

		await connection.getRepository(User).save(input);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...formatInput(input),
						tos: true,
						verification: verifyCode,
						phone,
					},
				},
			});

		const user = res.body.data?.userCreate;
		expect(user).toBeFalsy();

		// Make sure user not saved in DB
		const users = await connection.query('SELECT * FROM users');
		expect(users.length).toEqual(1);
	});

	it('does not create a user if phone does not match verifcation', async () => {
		const input = helpersService.createTestUser() as any;

		await connection.getRepository(User).save(input);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...input,
						tos: true,
						verification: verifyCode,
					},
				},
			});

		const user = res.body.data?.userCreate;
		expect(user).toBeFalsy();

		// Make sure user not saved in DB
		const users = await connection.query('SELECT * FROM users');
		expect(users.length).toEqual(1);
	});

	it('does not create a user as an admin without an admin account', async () => {
		await connection
			.getRepository(User)
			.save(helpersService.createTestUser());

		const input = formatInput(helpersService.createTestUser());

		input.role = UserRole.CUSTOMER;

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: adminUserCreateMutation,
				variables: {
					input: {
						...input,
						tos: true,
						phone,
					},
				},
			});

		const user = res.body.data.userCreate;
		expect(user).toBeFalsy();
	});

	it('does not create a user without agreeing to the terms of service', async () => {
		const input = formatInput(helpersService.createTestUser());

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...input,
						tos: false,
						verification: verifyCode,
						phone,
					},
				},
			});

		const user = res.body.data.userCreate;
		expect(user).toBeFalsy();
	});

	it('does not create a user without verification token', async () => {
		const input = formatInput(helpersService.createTestUser());

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...input,
						tos: true,
						phone,
					},
				},
			});

		const { data } = res.body;
		expect(data).toBeFalsy();
	});

	it('does not create a user if verification token is not valid', async () => {
		const input = formatInput(helpersService.createTestUser());

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: userCreateMutation,
				variables: {
					input: {
						...input,
						tos: true,
						phone,
						verification: faker.random.alphaNumeric(),
					},
				},
			});

		const user = res.body.data.userCreate;
		expect(user).toBeFalsy();
	});
});
