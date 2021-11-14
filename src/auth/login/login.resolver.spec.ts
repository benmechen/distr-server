import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../../common/api.error';
import { HelperService } from '../../common/helper/helper.service';
import { UserService } from '../../user/user.service';
import { UserServiceMock } from '../../user/user.service.mock';
import { AuthService } from '../auth.service';
import { AuthServiceMock } from '../auth.service.mock';
import { LoginResolver } from './login.resolver';

describe('LoginResolver', () => {
	let module: TestingModule;
	let resolver: LoginResolver;
	let authService: AuthService;
	let userService: UserService;
	let helpersService: HelperService;

	const context = {
		req: {
			ip: faker.internet.ip(),
		},
	};

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				LoginResolver,
				ConfigService,
				{
					provide: AuthService,
					useClass: AuthServiceMock,
				},
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
			],
		}).compile();

		resolver = module.get<LoginResolver>(LoginResolver);
		authService = module.get(AuthService);
		userService = module.get(UserService);
		helpersService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('should return a token', async () => {
		const testUser = helpersService.createTestUser();

		const date = new Date();

		const userServicefindByEmailOrPhoneSpy = jest
			.spyOn(userService, 'findByEmailOrPhone')
			.mockResolvedValue(testUser);
		const userServiceisUserLockedSpy = jest
			.spyOn(authService, 'isUserLocked')
			.mockReturnValue(false);
		const userServiceVerifyPasswordSpy = jest
			.spyOn(userService, 'verifyPassword')
			.mockResolvedValue(true);
		const authServiceResetLoginAttemptsSpy = jest
			.spyOn(authService, 'resetLoginAttempts')
			.mockResolvedValue(testUser);
		const authServiceCreateTokenSpy = jest
			.spyOn(authService, 'createToken')
			.mockResolvedValue('token');
		const authServiceSaveTokenSpy = jest.spyOn(authService, 'saveToken');
		jest.spyOn(authService, 'getTokenExpiration').mockReturnValue({
			accessToken: date,
			refreshToken: date,
		});

		const res = await resolver.login(
			testUser.email,
			testUser.phone,
			testUser.password,
			context as any,
		);
		expect(res).toEqual({
			accessToken: 'token',
			refreshToken: 'token',
			accessTokenExpiration: date,
		});

		expect(userServicefindByEmailOrPhoneSpy).toHaveBeenCalledWith(
			testUser.phone,
		);
		expect(userServiceisUserLockedSpy).toHaveBeenCalledWith(testUser);
		expect(userServiceVerifyPasswordSpy).toHaveBeenCalledWith(
			testUser,
			testUser.password,
		);
		expect(authServiceResetLoginAttemptsSpy).toHaveBeenCalled();
		expect(authServiceCreateTokenSpy).toHaveBeenNthCalledWith(
			1,
			testUser,
			'access',
		);
		expect(authServiceCreateTokenSpy).toHaveBeenNthCalledWith(
			2,
			testUser,
			'refresh',
		);
		expect(authServiceSaveTokenSpy).toHaveBeenCalled();
	});

	it('returns null if user not found', async () => {
		jest.spyOn(userService, 'findByEmailOrPhone').mockResolvedValue(
			undefined,
		);

		const res = await resolver.login('', '', '', context as any);
		expect(res).toEqual(null);
	});

	it('returns null if passwords do not match', async () => {
		const testUser = helpersService.createTestUser();
		jest.spyOn(userService, 'findByEmailOrPhone').mockResolvedValue(
			testUser,
		);
		jest.spyOn(authService, 'isUserLocked').mockReturnValue(false);
		jest.spyOn(userService, 'verifyPassword').mockResolvedValue(false);

		const res = await resolver.login('', '', '', context as any);
		expect(res).toEqual(null);
	});

	it('throws an error if user cannot access', async () => {
		const testUser = helpersService.createTestUser();
		jest.spyOn(userService, 'findByEmailOrPhone').mockResolvedValue(
			testUser,
		);
		jest.spyOn(authService, 'isUserLocked').mockReturnValue(
			new APIError(APIErrorCode.ACCOUNT_LOCKED),
		);
		jest.spyOn(userService, 'verifyPassword').mockResolvedValue(false);

		expect(async () =>
			resolver.login('', '', '', context as any),
		).rejects.toThrowError(APIError);
	});
});
