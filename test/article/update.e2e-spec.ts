import * as faker from 'faker';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection, getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User, UserRole } from '../../src/user/user.entity';
import { HelperService } from '../../src/common/helper/helper.service';
import { Article } from '../../src/article/article.entity';

describe('Article -> Update (e2e)', () => {
	let app: INestApplication;
	let connection: Connection;

	let testUser: User;
	let testArticle: Article;
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
		testArticle = helpersService.createTestArticle();
		await connection.getRepository(User).save({
			...testUser,
			role: UserRole.ADMIN,
			password: await bcrypt.hash(password, 12),
		});

		await connection.getRepository(Article).save(testArticle);

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

	const updateArticleMutation = `
	mutation updateArticle($id: ID!, $input: ArticleUpdateInput!) {
        articleUpdate(id: $id, input: $input) {
            ... on Article {
                title
                teaser
                publisher
                image
                body
            }
        }
    }
    `;

	it('updates an article', async () => {
		const originalArticle = helpersService.createTestArticle() as any;
		const input = originalArticle;
		delete input.id;
		delete input.created;
		delete input.updated;

		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: updateArticleMutation,
				variables: {
					id: testArticle.id,
					input,
				},
			})
			.expect(200);

		const article = res.body.data.articleUpdate;

		expect(article).toEqual(expect.objectContaining(input));

		const articles = await connection.query('SELECT * FROM articles');
		expect(articles[0]).toEqual(expect.objectContaining(originalArticle));
	});

	it('returns an error when trying to update an unknown manager', async () => {
		const input = { publisher: faker.name.firstName() };
		const res = await request(app.getHttpServer())
			.post('/graphql')
			.set('Authorization', `Bearer ${accessToken}`)
			.send({
				query: updateArticleMutation,
				variables: {
					id: faker.datatype.uuid(),
					input,
				},
			})
			.expect(200);

		expect(res.body.data.articleUpdate).toBeFalsy();
		expect(res.body.errors?.length).toEqual(1);
	});
});
