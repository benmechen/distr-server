import * as faker from 'faker';
import * as MockDate from 'mockdate';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { HelperService } from '../common/helper/helper.service';
import { User } from '../user/user.entity';
import { TokenService } from '../common/token/token.service';
import { TokenServiceMock } from '../common/token/token.service.mock';
import { APIErrorCode } from '../common/api.error';
import { Token } from '../common/token/token.entity';
import { UserServiceMock } from '../user/user.service.mock';

describe('AuthService', () => {
	let module: TestingModule;
	let service: AuthService;
	let helpersService: HelperService;
	let userService: UserService;
	let tokenService: TokenService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: ConfigService,
					useClass: ConfigService,
				},
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				{
					provide: TokenService,
					useClass: TokenServiceMock,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		userService = module.get<UserService>(UserService);
		tokenService = module.get<TokenService>(TokenService);
		helpersService = new HelperService();

		MockDate.set('2020-11-11');
	});

	afterEach(async () => {
		MockDate.reset();
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('validateUser', () => {
		it('retuns a user for a valid ID', async () => {
			// Create dummy user
			const testUser = helpersService.createTestUser();

			// Return user
			const userServiceFindByIDSpy = jest
				.spyOn(userService, 'findByID')
				.mockResolvedValue(testUser);

			const validatedUser = await service.validateUser(testUser.id);
			expect(validatedUser).toEqual(testUser);

			expect(userServiceFindByIDSpy).toHaveBeenCalledWith(testUser.id);
		});

		it('retuns null for an invalid ID', async () => {
			// Return null
			const userServiceFindByIDSpy = jest.spyOn(userService, 'findByID');

			const id = faker.datatype.uuid();
			const validatedUser = await service.validateUser(id);
			expect(validatedUser).toEqual(null);

			expect(userServiceFindByIDSpy).toHaveBeenCalledWith(id);
		});

		// TODO: Test roles
	});

	describe('createToken', () => {
		it('returns a valid JWT', async () => {
			// Create dummy user
			const testUser = User.of({
				id: faker.datatype.uuid(),
				email: faker.internet.email(),
			});

			const tokenServiceSignSpy = jest
				.spyOn(tokenService, 'sign')
				.mockReturnValue('token');

			const token = await service.createToken(testUser, 'access');
			expect(token).toEqual('token');

			expect(tokenServiceSignSpy).toBeCalledWith(
				{ sub: testUser.id, email: testUser.email, type: 'access' },
				'1m',
			);
		});
	});

	describe('verifyToken', () => {
		it('returns a payload for an access token', async () => {
			const data = {
				data: 'test',
				sub: faker.datatype.uuid(),
				type: 'access',
			};
			const tokenServiceVerifySpy = jest
				.spyOn(tokenService, 'verify')
				.mockResolvedValue(data);
			const tokenServiceGetTokensForUser = jest.spyOn(
				tokenService,
				'getTokensForUser',
			);

			const payload = await service.verifyToken('token', 'access');
			expect(payload).toEqual(data);
			expect(tokenServiceVerifySpy).toHaveBeenCalledWith('token');
			expect(tokenServiceGetTokensForUser).not.toHaveBeenCalled();
		});

		it('returns a payload for a refresh token', async () => {
			const data = {
				data: 'test',
				sub: faker.datatype.uuid(),
				type: 'refresh',
			};
			const tokenServiceVerifySpy = jest
				.spyOn(tokenService, 'verify')
				.mockResolvedValue(data);
			const tokenServiceGetTokensForUser = jest
				.spyOn(tokenService, 'getTokensForUser')
				.mockResolvedValue([
					{
						id: faker.datatype.uuid(),
						token: 'token',
						user: helpersService.createTestUser(),
						created: new Date(),
						updated: new Date(),
					},
				]);

			const payload = await service.verifyToken('token', 'refresh');
			expect(payload).toEqual(data);
			expect(tokenServiceVerifySpy).toHaveBeenCalledWith('token');
			expect(tokenServiceGetTokensForUser).toHaveBeenCalledWith(data.sub);
		});

		it('throws an error if a refresh token is not in the saved tokens list', async () => {
			const data = {
				data: 'test',
				sub: faker.datatype.uuid(),
				type: 'refresh',
			};
			jest.spyOn(tokenService, 'verify').mockResolvedValue(data);
			jest.spyOn(tokenService, 'getTokensForUser').mockResolvedValue([]);

			await expect(async () =>
				service.verifyToken('token', 'refresh'),
			).rejects.toThrow(APIErrorCode.INVALID_TOKEN);
		});

		it('throws an error if a types do not match', async () => {
			const data = {
				data: 'test',
				sub: faker.datatype.uuid(),
				type: 'refresh',
			};
			jest.spyOn(tokenService, 'verify').mockResolvedValue(data);
			jest.spyOn(tokenService, 'getTokensForUser').mockResolvedValue([]);

			await expect(async () =>
				service.verifyToken('token', 'access'),
			).rejects.toThrow(
				APIErrorCode.INVALID_TOKEN_TYPE.replace('resource', 'access'),
			);
		});
	});

	describe('saveToken', () => {
		it("adds a token to a user's issued list", async () => {
			const testUser = helpersService.createTestUser();
			const issuedToken = Token.of({
				token: 'token',
				user: testUser,
			});
			const tokenServiceSaveSpy = jest
				.spyOn(tokenService, 'save')
				.mockResolvedValue(issuedToken);
			await service.saveToken(testUser, 'token');

			expect(tokenServiceSaveSpy).toHaveBeenCalledWith({
				...issuedToken,
				id: expect.anything(),
			});
		});
	});

	describe('revokeToken', () => {
		it('calls the delete function on token service', async () => {
			const tokenServiceDeleteSpy = jest.spyOn(tokenService, 'delete');
			await service.revokeToken('token');
			expect(tokenServiceDeleteSpy).toHaveBeenCalledWith('token');
		});
	});

	describe('calculateTimeout', () => {
		it('returns the current date for 0 attempts', () => {
			expect(service.calculateTimeout(0)).toEqual(new Date());
		});

		it('returns the current date plus 8 for 4 attempts', () => {
			const now = new Date();
			now.setSeconds(now.getSeconds() + 8);
			expect(service.calculateTimeout(4)).toEqual(now);
		});
	});

	describe('halfExponential', () => {
		it('returns 0 for a c of 0', () => {
			expect(service.halfExponential(0)).toEqual(0);
		});

		it('returns 1 for a c of 1', () => {
			expect(service.halfExponential(1)).toEqual(1);
		});

		it('returns 0 for a c of -1', () => {
			expect(service.halfExponential(-1)).toEqual(0);
		});

		it('returns 8 for a c of 4', () => {
			expect(service.halfExponential(4)).toEqual(8);
		});
	});

	describe('differenceSeconds', () => {
		it('returns the difference in seconds', () => {
			const start = new Date();
			const end = new Date();
			end.setSeconds(end.getSeconds() + 2);
			expect(service.getDateDifference(start, end)).toEqual('2 seconds');
		});
	});
});
