import * as faker from 'faker';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
	NotificationService,
	NotificationServiceMock,
} from '@chelseaapps/notification';
import { TokenService } from '../../common/token/token.service';
import { TokenServiceMock } from '../../common/token/token.service.mock';
import { Code, CodeRepositoryMock } from './code.entity';
import { CodeService } from './code.service';

describe('CodeService', () => {
	let service: CodeService;
	let tokenService: TokenService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CodeService,
				{
					provide: getRepositoryToken(Code),
					useClass: CodeRepositoryMock,
				},
				{
					provide: ConfigService,
					useValue: {
						get: () => null,
					},
				},
				{
					provide: NotificationService,
					useClass: NotificationServiceMock,
				},
				{
					provide: TokenService,
					useClass: TokenServiceMock,
				},
			],
		}).compile();

		service = module.get<CodeService>(CodeService);
		tokenService = module.get<TokenService>(TokenService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getRandomCode', () => {
		it('returns a 6 digit long code every time if no length specified', () => {
			const codes = [];
			for (let i = 0; i < 20; i += 1) {
				codes.push(service.getRandomCode());
			}

			expect(codes.join('').length).toEqual(20 * 6);
		});

		it('returns an n digit long code every time', () => {
			const n = 10;

			const codes = [];
			for (let i = 0; i < 20; i += 1) {
				codes.push(service.getRandomCode(n));
			}

			expect(codes.join('').length).toEqual(20 * n);
		});
	});

	describe('verify', () => {
		it('throws an error if code not found', async () => {
			const code = faker.random.word();

			const serviceFindByIDSpy = jest
				.spyOn(service, 'findByCode')
				.mockImplementation(async () => undefined);

			await expect(service.verify(code)).rejects.toThrow();

			expect(serviceFindByIDSpy).toHaveBeenCalledWith(code);
		});

		it('throws an error and deletes code if expired', async () => {
			const code = Code.of({
				code: faker.random.word(),
				created: faker.date.past(1),
			});

			jest.spyOn(service, 'findByCode').mockImplementation(
				async () => code,
			);
			const serviceDeleteSpy = jest
				.spyOn(service, 'delete')
				.mockImplementation(async () => code);

			await expect(service.verify(code.code)).rejects.toThrow();

			expect(serviceDeleteSpy).toHaveBeenCalledWith(code);
		});

		it('generates a token if code valid', async () => {
			const code = Code.of({
				code: faker.random.word(),
				identifier: faker.phone.phoneNumber(),
				created: new Date(),
			});

			jest.spyOn(service, 'findByCode').mockImplementation(
				async () => code,
			);
			const serviceDeleteSpy = jest
				.spyOn(service, 'delete')
				.mockImplementation(async () => code);
			const tokenServiceSignSpy = jest
				.spyOn(tokenService, 'sign')
				.mockReturnValue('token');

			const token = await service.verify(code.code);

			expect(token).toEqual('token');
			expect(serviceDeleteSpy).toHaveBeenCalledWith(code);
			expect(tokenServiceSignSpy).toHaveBeenCalledWith(
				{
					sub: code.identifier,
					code: code.code,
				},
				expect.anything(),
			);
		});
	});
});
