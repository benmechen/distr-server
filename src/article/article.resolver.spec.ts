import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HelperService } from '../common/helper/helper.service';
import { HelpersServiceMock } from '../common/helper/helper.service.mock';
import { Article, ArticleRepositoryMock } from './article.entity';
import { ArticleResolver } from './article.resolver';
import { ArticleService } from './article.service';

describe('ArticleResolver', () => {
	let module: TestingModule;
	let resolver: ArticleResolver;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ArticleResolver,
				{
					provide: ArticleService,
					useClass: ArticleRepositoryMock,
				},
				{
					provide: HelperService,
					useClass: HelpersServiceMock,
				},
				{
					provide: getRepositoryToken(Article),
					useClass: ArticleRepositoryMock,
				},
			],
		}).compile();

		resolver = module.get<ArticleResolver>(ArticleResolver);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});
});
