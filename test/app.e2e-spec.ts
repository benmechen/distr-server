import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;
	let ordersConnection: Connection;

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
	});

	afterAll(async () => {
		await app.close();
	});

	it('/ (GET)', () =>
		request(app.getHttpServer()).get('/status').expect(200));
});
