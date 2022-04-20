import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthServiceMock } from '../auth.service.mock';
import { RefreshResolver } from './refresh.resolver';
import { UserService } from '../../user/user.service';
import { UserServiceMock } from '../../user/user.service.mock';
import { HelperService } from '../../common/helper/helper.service';

describe('RefreshResolver', () => {
	let module: TestingModule;
	let resolver: RefreshResolver;
	let authService: AuthService;
	let userService: UserService;

	const helpersService = new HelperService();

	const context = {
		req: {
			ip: faker.internet.ip(),
		},
	};

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				RefreshResolver,
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

		resolver = module.get<RefreshResolver>(RefreshResolver);
		authService = module.get<AuthService>(AuthService);
		userService = module.get<UserService>(UserService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('returns a new access and refresh token', async () => {
		const testUser = helpersService.createTestUser();

		const payload = {
			email: testUser.email,
			sub: testUser.id,
			type: 'refresh' as const,
		};

		const date = new Date();

		const authServiceVerifyTokenSpy = jest
			.spyOn(authService, 'verifyToken')
			.mockResolvedValue(payload);
		const userServiceisUserLockedSpy = jest
			.spyOn(userService, 'findByID')
			.mockResolvedValue(testUser);
		const authServiceisUserLockedSpy = jest
			.spyOn(authService, 'isUserLocked')
			.mockReturnValue(false);
		const authServiceCreateTokenSpy = jest
			.spyOn(authService, 'createToken')
			.mockResolvedValue('accessToken');
		jest.spyOn(authService, 'getTokenExpiration').mockReturnValue({
			accessToken: date,
			refreshToken: date,
		});

		const res = await resolver.refresh('refreshToken', context as any);

		expect(res).toEqual({
			refreshToken: 'accessToken',
			accessToken: 'accessToken',
			accessTokenExpiration: date,
			role: undefined,
		});
		expect(authServiceVerifyTokenSpy).toHaveBeenCalledWith(
			'refreshToken',
			'refresh',
		);
		expect(userServiceisUserLockedSpy).toHaveBeenCalledWith(testUser.id);
		expect(authServiceisUserLockedSpy).toHaveBeenCalled();
		expect(authServiceCreateTokenSpy).toHaveBeenCalledWith(
			{
				id: payload.sub,
				email: payload.email,
			},
			'access',
		);
	});
});
