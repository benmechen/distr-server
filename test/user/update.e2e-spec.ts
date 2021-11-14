import * as faker from 'faker';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/user.entity';
import { HelperService } from '../../src/common/helper/helper.service';

describe('User -> Update (e2e)', () => {
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

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.send({
				query: `mutation login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        accessToken
                    }
                }`,
				variables: {
					email: testUser.email,
					password,
				},
			})
			.expect(200);

		({ accessToken } = res.body.data.login);
	});

	afterAll(async () => {
		await app.close();
	});

	const userUpdateMutation = `
	mutation updateUser($id: String!, $input: UserUpdateInput!) {
		userUpdate(id: $id, input: $input) {
			id
            firstName
            lastName
            email
            phone
			role
		}
	}
	`;

	const adminUserUpdateMutation = `
	mutation adminUpdateUser($id: String!, $input: AdminUserUpdateInput!) {
		adminUserUpdate(id: $id, input: $input) {
			id
            firstName
            lastName
            email
            phone
            role
		}
	}
    `;

	it('updates a user', async () => {
		const firstName = faker.name.firstName();
		const lastName = faker.name.lastName();
		const phone = faker.phone.phoneNumber('07425######');
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: userUpdateMutation,
				variables: {
					id: testUser.id,
					input: {
						firstName,
						lastName,
						phone,
					},
				},
			})
			.expect(200);

		const user = res.body.data.userUpdate;

		expect(user.firstName).toEqual(firstName);
		expect(user.lastName).toEqual(lastName);
		expect(user.phone).toEqual(`+44${phone.substr(1, phone.length)}`);

		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');

		expect(users[0].firstName).toEqual(firstName);
		expect(users[0].lastName).toEqual(lastName);
		expect(users[0].phone).toEqual(`+44${phone.substr(1, phone.length)}`);
	});

	it('updates email and password with current password', async () => {
		const email = faker.internet.email();
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: userUpdateMutation,
				variables: {
					id: testUser.id,
					input: {
						email,
						password: faker.internet.password(),
						currentPassword: password,
					},
				},
			})
			.expect(200);

		const user = res.body.data.userUpdate;
		expect(user.email).toEqual(email);

		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');
		const hashedPassword = await bcrypt.hash(password, 12);
		expect(users[0].password).not.toEqual(hashedPassword);
	});

	it('does not update email and password without current password', async () => {
		const prevUsers = await connection.query('SELECT * FROM users');
		const prevPassword = prevUsers[0].password;

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: userUpdateMutation,
				variables: {
					id: testUser.id,
					input: {
						email: faker.internet.email(),
						password: faker.internet.password(),
					},
				},
			})
			.expect(200);

		const user = res.body.data.userUpdate;
		expect(user).toBeFalsy();

		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');
		expect(users[0].password).toEqual(prevPassword);
	});

	it('does not update email if exists', async () => {
		const prevUsers = await connection.query('SELECT * FROM users');
		const prevEmail = prevUsers[0].email;

		const existingUser = helpersService.createTestUser();
		await connection.getRepository(User).save(existingUser);

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: userUpdateMutation,
				variables: {
					id: testUser.id,
					input: {
						email: existingUser.email,
						currentPassword: password,
					},
				},
			})
			.expect(200);

		const user = res.body.data.userUpdate;
		expect(user).toBeFalsy();

		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');
		expect(users[0].email).toEqual(prevEmail);
	});

	it('does not update a users role without an admin account', async () => {
		const prevUsers = await connection.query('SELECT * FROM users');
		const prevRole = prevUsers[0].role;

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: adminUserUpdateMutation,
				variables: {
					id: testUser.id,
					input: {
						role: 'ADMIN',
					},
				},
			})
			.expect(200);

		const user = res.body.data.userUpdate;
		expect(user).toBeFalsy();

		// Make sure user saved in DB
		const users = await connection.query('SELECT * FROM users');
		expect(users[0].role).toEqual(prevRole);
	});
});
