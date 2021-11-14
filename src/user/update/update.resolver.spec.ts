import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HelperService } from '../../common/helper/helper.service';
import { UserService } from '../user.service';
import { UserUpdateResolver } from './update.resolver';
import { APIErrorCode } from '../../common/api.error';
import { UserServiceMock } from '../user.service.mock';
import { UserRole } from '../user.entity';

describe('UpdateResolver', () => {
	let module: TestingModule;
	let resolver: UserUpdateResolver;
	let userService: UserService;
	let helpersService: HelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserUpdateResolver,
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				ConfigService,
			],
		}).compile();

		resolver = module.get<UserUpdateResolver>(UserUpdateResolver);
		userService = module.get(UserService);
		helpersService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('returns an updated user', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName(),
		};

		const updatedUser = {
			...testUser,
			...input,
		};

		const userServiceCanModifyUserSpy = jest
			.spyOn(userService, 'canModifyUser')
			.mockReturnValue(true);
		const userServiceFindByIDSpy = jest
			.spyOn(userService, 'findByID')
			.mockResolvedValue(testUser);
		const userServiceUpdateSpy = jest
			.spyOn(userService, 'update')
			.mockResolvedValue(updatedUser);

		const res = await resolver.userUpdate(testUser.id, input, testUser);
		expect(res).toEqual(updatedUser);

		expect(userServiceCanModifyUserSpy).toHaveBeenCalledWith(
			testUser,
			testUser.id,
			false,
		);
		expect(userServiceFindByIDSpy).toHaveBeenCalledWith(testUser.id);
		expect(userServiceUpdateSpy).toHaveBeenCalledWith(testUser, input);
	});

	it('checks the users password if password given', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			password: faker.internet.password(),
			currentPassword: testUser.password,
		};

		const updatedUser = {
			...testUser,
			...input,
		};

		jest.spyOn(userService, 'canModifyUser').mockReturnValue(true);
		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);
		const userServiceVerifyPasswordSpy = jest
			.spyOn(userService, 'verifyPassword')
			.mockResolvedValue(true);
		const userServiceUpdateSpy = jest
			.spyOn(userService, 'update')
			.mockResolvedValue(updatedUser);

		const res = await resolver.userUpdate(testUser.id, input, testUser);
		expect(res).toEqual(updatedUser);

		expect(userServiceVerifyPasswordSpy).toHaveBeenCalledWith(
			testUser,
			input.currentPassword,
		);
		expect(userServiceUpdateSpy).toHaveBeenCalledWith(testUser, input);
	});

	it('checks the users password if email given', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			email: faker.internet.email(),
			currentPassword: testUser.password,
		};

		const updatedUser = {
			...testUser,
			...input,
		};

		jest.spyOn(userService, 'canModifyUser').mockReturnValue(true);
		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);
		const userServiceVerifyPasswordSpy = jest
			.spyOn(userService, 'verifyPassword')
			.mockResolvedValue(true);
		const userServiceUpdateSpy = jest
			.spyOn(userService, 'update')
			.mockResolvedValue(updatedUser);

		const res = await resolver.userUpdate(testUser.id, input, testUser);
		expect(res).toEqual(updatedUser);

		expect(userServiceVerifyPasswordSpy).toHaveBeenCalledWith(
			testUser,
			input.currentPassword,
		);
		expect(userServiceUpdateSpy).toHaveBeenCalledWith(testUser, input);
	});

	it('throws an error if current password is incorrect', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			password: faker.internet.password(),
			currentPassword: faker.internet.password(),
		};

		jest.spyOn(userService, 'canModifyUser').mockReturnValue(true);
		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);
		jest.spyOn(userService, 'verifyPassword').mockResolvedValue(false);

		await expect(async () =>
			resolver.userUpdate(testUser.id, input, testUser),
		).rejects.toThrow(APIErrorCode.BAD_PASSWORD);
	});

	it('throws an error if new email is already registered', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			email: faker.internet.email(),
			currentPassword: testUser.password,
		};

		jest.spyOn(userService, 'canModifyUser').mockReturnValue(true);
		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);
		jest.spyOn(userService, 'verifyPassword').mockResolvedValue(true);
		const userServiceIsEmailRegisteredSpy = jest
			.spyOn(userService, 'isEmailRegistered')
			.mockResolvedValue(true);

		await expect(async () =>
			resolver.userUpdate(testUser.id, input, testUser),
		).rejects.toThrow(APIErrorCode.USER_EXISTS_EMAIL);

		expect(userServiceIsEmailRegisteredSpy).toHaveBeenCalledWith(
			input.email,
		);
	});

	it('throws an error if trying to update another user', async () => {
		const testUser = helpersService.createTestUser();

		const input = {};

		jest.spyOn(userService, 'canModifyUser').mockReturnValue(false);
		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);
		jest.spyOn(userService, 'verifyPassword').mockResolvedValue(true);

		await expect(async () =>
			resolver.userUpdate(
				testUser.id,
				input,
				helpersService.createTestUser(),
			),
		).rejects.toThrow(APIErrorCode.UNAUTHORISED);
	});

	it('does not throw an error if trying to update another user as an admin', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			firstName: faker.name.firstName(),
		};

		const updatedUser = {
			...testUser,
			...input,
		};

		jest.spyOn(userService, 'canModifyUser').mockReturnValue(true);
		jest.spyOn(userService, 'findByID').mockResolvedValue(testUser);
		jest.spyOn(userService, 'verifyPassword').mockResolvedValue(true);
		jest.spyOn(userService, 'isEmailRegistered').mockResolvedValue(true);
		jest.spyOn(userService, 'update').mockResolvedValue(updatedUser);

		const res = await resolver.userUpdate(testUser.id, input, testUser);
		expect(res).toEqual(updatedUser);
	});

	it('throws an error if do not have permissions to update user role', async () => {
		const testUser = helpersService.createTestUser();

		const input = {
			role: UserRole.ADMIN,
		};

		const userServiceCanUserSetRoleSpy = jest
			.spyOn(userService, 'canUserSetRole')
			.mockReturnValue(false);

		const adminUser = helpersService.createTestUser();
		await expect(async () =>
			resolver.adminUserUpdate(testUser.id, input, adminUser),
		).rejects.toThrow(APIErrorCode.UNAUTHORISED);

		expect(userServiceCanUserSetRoleSpy).toHaveBeenCalledWith(
			adminUser,
			input.role,
		);
	});
});
