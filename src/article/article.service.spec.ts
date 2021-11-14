import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelperService } from '../common/helper/helper.service';
import { HelpersServiceMock } from '../common/helper/helper.service.mock';
import { Article, ArticleRepositoryMock } from './article.entity';
import { ArticleService } from './article.service';
import { APIErrorCode } from '../common/api.error';

describe('ArticleService', () => {
	let module: TestingModule;
	let service: ArticleService;
	let realHelpersService: HelperService;
	let articleRepository: Repository<Article>;
	let helpersService: HelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ArticleService,
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

		service = module.get<ArticleService>(ArticleService);
		articleRepository = module.get(getRepositoryToken(Article));
		helpersService = module.get(HelperService);
		realHelpersService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findByID', () => {
		it('finds an entity by its ID succesfully', async () => {
			// Create dummy article
			const testArticle = realHelpersService.createTestArticle();
			testArticle.id = faker.datatype.uuid();

			// Override helper function
			const helpersServiceIsValidIDSpy = jest
				.spyOn(helpersService, 'isValidID')
				.mockReturnValue(true);
			// Return article
			const articleRepositoryFindOneSpy = jest
				.spyOn(articleRepository, 'findOne')
				.mockResolvedValue(testArticle);

			const foundArticle = await service.findByID(testArticle.id);
			expect(foundArticle).toEqual(expect.objectContaining(testArticle));
			expect(articleRepositoryFindOneSpy).toHaveBeenCalledWith(
				testArticle.id,
			);
			expect(helpersServiceIsValidIDSpy).toHaveBeenCalledWith(
				testArticle.id,
			);
		});

		it('does not return a article with an invalid ID', async () => {
			// Override helper function to return false
			const helpersServiceIsValidIDSpy = jest
				.spyOn(helpersService, 'isValidID')
				.mockReturnValue(false);
			// Spy on func to make sure it isn't reached
			const articleRepositoryFindOneSpy = jest.spyOn(
				articleRepository,
				'findOne',
			);

			await expect(async () =>
				service.findByID('invalid-uuid'),
			).rejects.toThrow(APIErrorCode.INVALID_ID);
			expect(articleRepositoryFindOneSpy).toHaveBeenCalledTimes(0);
			expect(helpersServiceIsValidIDSpy).toHaveBeenCalledWith(
				'invalid-uuid',
			);
		});
	});

	describe('findAll', () => {
		it('returns a list of articles', async () => {
			// Create dummy article
			const testArticle = realHelpersService.createTestArticle();
			testArticle.id = faker.datatype.uuid();

			const testArticles = [testArticle];

			// Return article
			const articleRepositoryFindSpy = jest
				.spyOn(articleRepository, 'find')
				.mockResolvedValue(testArticles);

			const foundArticle = await service.findAll();
			expect(foundArticle).toEqual(expect.arrayContaining(testArticles));
			expect(articleRepositoryFindSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('create', () => {
		it('return a article', async () => {
			// Create dummy article
			const testArticle = realHelpersService.createTestArticle();
			testArticle.id = faker.datatype.uuid();

			// Return article
			const articleRepositorySaveSpy = jest
				.spyOn(articleRepository, 'save')
				.mockResolvedValue(Article.of(testArticle));

			const createdArticle = await service.create(testArticle);
			expect(createdArticle).toEqual(
				expect.objectContaining(testArticle),
			);
			expect(articleRepositorySaveSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('update', () => {
		it('returns a article with updated details', async () => {
			// Create dummy article
			const testArticle = realHelpersService.createTestArticle();

			const input = {
				title: faker.lorem.sentence(),
				publisher: faker.lorem.words(2),
			};

			const updatedDetails = {
				...testArticle,
				...input,
			};

			// Return article
			const articleRepositorySaveSpy = jest
				.spyOn(articleRepository, 'save')
				.mockResolvedValue(Article.of(updatedDetails));

			const updatedArticle = await service.update(testArticle, input);
			expect(updatedArticle).toEqual(
				expect.objectContaining(updatedDetails),
			);

			expect(articleRepositorySaveSpy).toHaveBeenCalledWith(
				updatedDetails,
			);
		});
	});

	describe('delete', () => {
		it('deletes a article by their ID', async () => {
			// Create dummy article
			const testArticle = realHelpersService.createTestArticle();

			const articleServiceFindByIDSpy = jest
				.spyOn(service, 'findByID')
				.mockResolvedValue(testArticle);
			const articleRepositoryDeleteSpy = jest
				.spyOn(articleRepository, 'remove')
				.mockResolvedValue(testArticle);

			const deletedArticle = await service.delete(testArticle.id);
			expect(deletedArticle).toEqual(testArticle);

			expect(articleServiceFindByIDSpy).toHaveBeenCalledWith(
				testArticle.id,
			);
			expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith(
				testArticle,
			);
		});

		it('deletes a article using an instance', async () => {
			// Create dummy article
			const testArticle = realHelpersService.createTestArticle();

			// Return article
			const articleRepositoryRemoveSpy = jest
				.spyOn(articleRepository, 'remove')
				.mockResolvedValue(testArticle);

			const deletedArticle = await service.delete(testArticle);
			expect(deletedArticle).toEqual(testArticle);

			expect(articleRepositoryRemoveSpy).toHaveBeenCalledWith(
				testArticle,
			);
		});
	});
});
