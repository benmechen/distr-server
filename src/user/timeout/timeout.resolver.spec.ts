import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HelperService } from '../../common/helper/helper.service';
import { AuthService } from '../../auth/auth.service';
import { AuthServiceMock } from '../../auth/auth.service.mock';

import { TokenService } from '../../common/token/token.service';
import { TokenServiceMock } from '../../common/token/token.service.mock';
import { UserService } from '../user.service';
import { UserServiceMock } from '../user.service.mock';
import { APIError, APIErrorCode } from '../../common/api.error';

import { UserTimeoutResolver } from './timeout.resolver';

describe('UserLinkResolver', () => {
	let module: TestingModule;
	let resolver: UserTimeoutResolver;
	let userService: UserService;
	let helperService: HelperService;

	// let tokenService: TokenService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserTimeoutResolver,
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				{
					provide: ConfigService,
					useClass: ConfigService,
				},
				{
					provide: AuthService,
					useClass: AuthServiceMock,
				},
				{
					provide: TokenService,
					useClass: TokenServiceMock,
				},
				ConfigService,
			],
		}).compile();

		resolver = module.get<UserTimeoutResolver>(UserTimeoutResolver);
		userService = module.get(UserService);
		// tokenService = module.get(TokenService);
		helperService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('Should return an error when trying to set the timeout in the past (self inflicted)', async () => {
		const testUser = helperService.createTestUser();

		jest.spyOn(userService, 'setTimeout').mockRejectedValue(
			new APIError(APIErrorCode.INVALID_DATE),
		);

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 100);

		await expect(async () =>
			resolver.userSetTimeout(yesterday, testUser),
		).rejects.toThrow(APIErrorCode.INVALID_DATE);
	});

	it('Should return a successful response when trying to set the timeout in the future (self inflicted)', async () => {
		const testUser = helperService.createTestUser();

		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);

		const userServiceSpy = jest
			.spyOn(userService, 'setTimeout')
			.mockResolvedValue(testUser);

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		await resolver.userSetTimeout(tomorrow, testUser);

		expect(userServiceSpy).toBeCalledWith(testUser, tomorrow, false);
	});

	it('Should return an error when trying to set the timeout of a user that does not exist', async () => {
		const testUser = helperService.createTestUser();

		const userServiceSpy = jest.spyOn(userService, 'findByID');

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		await expect(async () => {
			return resolver.adminUserSetTimeout(
				testUser.id,
				tomorrow,
				testUser,
			);
		}).rejects.toThrow(APIErrorCode.NOT_FOUND);

		expect(userServiceSpy).toBeCalledWith(testUser.id);
	});

	it('Should return a successful response when trying to set the timeout of a user that does exist', async () => {
		const testUser = helperService.createTestUser();

		const userServiceSpy = jest
			.spyOn(userService, 'findByID')
			.mockResolvedValue(testUser);

		const timeoutResolverSpy = jest
			.spyOn(resolver, 'userSetTimeout')
			.mockResolvedValue(testUser);

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		await resolver.adminUserSetTimeout(testUser.id, tomorrow, testUser);

		expect(userServiceSpy).toBeCalledWith(testUser.id);
		expect(timeoutResolverSpy).toBeCalledWith(tomorrow, testUser, true);
	});

	it('Should return an error when trying to remove the timeout of a user that does not exist', async () => {
		const testUser = helperService.createTestUser();

		const userServiceSpy = jest.spyOn(userService, 'findByID');

		await expect(async () => {
			return resolver.adminUserRemoveTimeout(testUser.id, testUser);
		}).rejects.toThrow(APIErrorCode.NOT_FOUND);

		expect(userServiceSpy).toBeCalledWith(testUser.id);
	});

	it('Should return a successful response when trying to remove the timeout of a user that does exist', async () => {
		const testUser = helperService.createTestUser();

		const userServiceSpy = jest
			.spyOn(userService, 'findByID')
			.mockResolvedValue(testUser);

		const userEditServiceSpy = jest
			.spyOn(userService, 'removeTimeout')
			.mockResolvedValue(testUser);

		await resolver.adminUserRemoveTimeout(testUser.id, testUser);

		expect(userServiceSpy).toBeCalledWith(testUser.id);
		expect(userEditServiceSpy).toBeCalledWith(testUser);
	});
});
