import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user.service';
import { UserCreateResolver } from './create.resolver';
import { UserCreateInput } from './create.input';
import { HelperService } from '../../common/helper/helper.service';
import { AuthService } from '../../auth/auth.service';
import { AuthServiceMock } from '../../auth/auth.service.mock';
import { APIErrorCode } from '../../common/api.error';
import { AdminUserCreateInput } from './adminCreate.input';
import { UserRole } from '../user.entity';
import { UserServiceMock } from '../user.service.mock';
import { HelpersServiceMock } from '../../common/helper/helper.service.mock';
import { CodeService } from '../../auth/code/code.service';
import { CodeServiceMock } from '../../auth/code/code.service.mock';
import { OrganisationService } from '../../organisation/organisation.service';
import { OrganisationServiceMock } from '../../organisation/organisation.service.mock';

describe('CreateResolver', () => {
	let module: TestingModule;
	let resolver: UserCreateResolver;
	let userService: UserService;
	let authService: AuthService;
	let helpersService: HelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserCreateResolver,
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				{
					provide: AuthService,
					useClass: AuthServiceMock,
				},
				{
					provide: HelperService,
					useClass: HelpersServiceMock,
				},
				{
					provide: CodeService,
					useClass: CodeServiceMock,
				},
				{
					provide: OrganisationService,
					useClass: OrganisationServiceMock,
				},
				ConfigService,
			],
		}).compile();

		resolver = module.get<UserCreateResolver>(UserCreateResolver);
		userService = module.get(UserService);

		authService = module.get(AuthService);
		helpersService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('returns a new user', async () => {
		// Create dummy user
		const testUser = helpersService.createTestUser();

		const input = new UserCreateInput();
		input.firstName = testUser.firstName;
		input.lastName = testUser.lastName;
		input.email = testUser.email;
		input.password = testUser.password;

		const date = new Date();

		const userServiceIsEmailRegisteredSpy = jest
			.spyOn(userService, 'isEmailRegistered')
			.mockResolvedValue(false);
		const userServiceCreateSpy = jest
			.spyOn(userService, 'create')
			.mockResolvedValue(testUser);
		const userServiceSendWelcomeEmailSpy = jest.spyOn(
			userService,
			'sendWelcomeEmail',
		);
		const authServiceCreateTokenSpy = jest
			.spyOn(authService, 'createToken')
			.mockResolvedValue('token');
		const authServiceSaveTokenSpy = jest.spyOn(authService, 'saveToken');
		jest.spyOn(authService, 'getTokenExpiration').mockReturnValue({
			accessToken: date,
			refreshToken: date,
		});

		const user = await resolver.userCreate(input);
		expect(user).toEqual(expect.objectContaining(testUser));
		expect(user.tokens).toEqual({
			accessToken: 'token',
			refreshToken: 'token',
			accessTokenExpiration: date,
		});

		expect(userServiceIsEmailRegisteredSpy).toHaveBeenCalledWith(
			testUser.email,
		);

		userServiceCreateSpy.mock.calls[0][0] = {
			...userServiceCreateSpy.mock.calls[0][0],
		};
		expect(userServiceCreateSpy).toHaveBeenCalledWith(
			{
				...input,
				role: 'CUSTOMER',
			},
			false,
		);
		expect(userServiceSendWelcomeEmailSpy).toHaveBeenCalled();
		expect(authServiceCreateTokenSpy).toHaveBeenNthCalledWith(
			1,
			testUser,
			'refresh',
		);
		expect(authServiceCreateTokenSpy).toHaveBeenNthCalledWith(
			2,
			testUser,
			'access',
		);
		expect(authServiceSaveTokenSpy).toHaveBeenCalledWith(testUser, 'token');
	});

	it('throws an error if email exists', async () => {
		// Create dummy user
		const testUser = helpersService.createTestUser();

		const input = new UserCreateInput();
		input.firstName = testUser.firstName;
		input.lastName = testUser.lastName;
		input.email = testUser.email;
		input.password = testUser.password;

		jest.spyOn(userService, 'isEmailRegistered').mockResolvedValue(true);

		await expect(async () => resolver.userCreate(input)).rejects.toThrow(
			APIErrorCode.USER_EXISTS_EMAIL,
		);
	});

	it('calls the main user create as an admin', async () => {
		// Create dummy user
		const testUser = helpersService.createTestUser();

		const input = new AdminUserCreateInput();
		input.firstName = testUser.firstName;
		input.lastName = testUser.lastName;
		input.email = testUser.email;
		input.password = testUser.password;
		input.role = UserRole.CUSTOMER;

		const userServiceCanUserSetRoleSpy = jest
			.spyOn(userService, 'canUserSetRole')
			.mockReturnValue(true);
		const userResolverCreateMockSpy = jest
			.spyOn(resolver, 'userCreate')
			.mockResolvedValue({} as any);

		const adminUser = helpersService.createTestUser();
		await resolver.adminUserCreate(input, adminUser);

		expect(userServiceCanUserSetRoleSpy).toHaveBeenCalledWith(
			adminUser,
			input.role,
		);
		expect(userResolverCreateMockSpy).toHaveBeenCalledWith(
			input,
			input.role,
		);
	});

	it('throws an error if an admin sets a user role without permission', async () => {
		// Create dummy user
		const testUser = helpersService.createTestUser();

		const input = new AdminUserCreateInput();
		input.firstName = testUser.firstName;
		input.lastName = testUser.lastName;
		input.email = testUser.email;
		input.password = testUser.password;
		input.role = UserRole.CUSTOMER;

		const userServiceCanUserSetRoleSpy = jest
			.spyOn(userService, 'canUserSetRole')
			.mockReturnValue(false);

		const adminUser = helpersService.createTestUser();
		await expect(async () =>
			resolver.adminUserCreate(input, adminUser),
		).rejects.toThrow(APIErrorCode.UNAUTHORISED);

		expect(userServiceCanUserSetRoleSpy).toHaveBeenCalledWith(
			adminUser,
			input.role,
		);
	});
});
