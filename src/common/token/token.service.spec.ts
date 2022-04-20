import * as faker from 'faker';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityRepository } from '@mikro-orm/mysql';
import { Token, TokenRepositoryMock } from './token.entity';
import { TokenService } from './token.service';
import { HelperService } from '../helper/helper.service';

/* eslint-disable */
class JwtServiceMock {
	public sign(): void {}
	public verify(): void {}
}
/* eslint-enable */

describe('TokenService', () => {
	let module: TestingModule;
	let service: TokenService;
	let jwtService: JwtService;
	let tokenRepository: EntityRepository<Token>;
	let helpersService: HelperService;
	const publicKey = 'publicKey';
	const privateKey = 'privateKey';

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				TokenService,
				{
					provide: ConfigService,
					useClass: ConfigService,
				},
				{
					provide: JwtService,
					useClass: JwtServiceMock,
				},
				{
					provide: getRepositoryToken(Token),
					useClass: TokenRepositoryMock,
				},
				{
					provide: 'public',
					useValue: publicKey,
				},
				{
					provide: 'private',
					useValue: privateKey,
				},
				{
					provide: 'SECRETS',
					useValue: { private: privateKey, public: publicKey },
				},
			],
		}).compile();

		service = module.get<TokenService>(TokenService);
		jwtService = module.get<JwtService>(JwtService);
		tokenRepository = module.get(getRepositoryToken(Token));
		helpersService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('sign', () => {
		it('should sign a payload', () => {
			const jwtServiceSignSpy = jest
				.spyOn(jwtService, 'sign')
				.mockReturnValue('token');
			const payload = { data: 'test' };
			const token = service.sign(payload, '30s');
			expect(token).toEqual('token');
			expect(jwtServiceSignSpy).toHaveBeenCalledWith(payload, {
				expiresIn: '30s',
				algorithm: service.options.algorithms?.[0] ?? 'HS256',
				issuer: service.options.issuer,
				privateKey,
			});
		});
	});

	describe('verify', () => {
		it('should verify a payload (valid)', () => {
			const jwtServiceVerifySpy = jest
				.spyOn(jwtService, 'verify')
				.mockReturnValue({
					data: 'test',
				});
			const decodedToken = service.verify('token');
			expect(decodedToken).toBeDefined();
			expect(decodedToken).toMatchObject({
				data: 'test',
			});
			expect(jwtServiceVerifySpy).toHaveBeenCalledWith('token', {
				algorithms: service.options.algorithms,
				issuer: service.options.issuer,
				publicKey,
			});
		});
	});

	describe('getTokensForUser', () => {
		it('should get all tokens for a user', async () => {
			const testUser = helpersService.createTestUser();
			const token = {
				id: faker.datatype.uuid(),
				user: testUser,
				token: 'token',
				created: new Date(),
				updated: new Date(),
			};
			const tokenRepositoryFindSpy = jest
				.spyOn(tokenRepository, 'find')
				.mockResolvedValue([token]);
			const tokens = await service.getTokensForUser(testUser.id);
			expect(tokens[0]).toEqual(token);
			expect(tokenRepositoryFindSpy).toHaveBeenCalledWith({
				user: testUser.id,
			});
		});

		it('returns nothing for a non-existent user', async () => {
			const tokenRepositoryFindSpy = jest
				.spyOn(tokenRepository, 'find')
				.mockResolvedValue([]);
			const id = faker.datatype.uuid();
			const tokens = await service.getTokensForUser(id);
			expect(tokens).toEqual([]);
			expect(tokenRepositoryFindSpy).toHaveBeenCalledWith({
				user: id,
			});
		});
	});

	describe('delete', () => {
		it('calls delete for a token', async () => {
			const tokenRepositoryDeleteSpy = jest.spyOn(
				tokenRepository,
				'removeAndFlush',
			);
			await service.delete('token');
			expect(tokenRepositoryDeleteSpy).toHaveBeenCalledWith({
				token: 'token',
			});
		});
	});
});
