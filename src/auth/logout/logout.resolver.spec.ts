import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthServiceMock } from '../auth.service.mock';
import { LogoutResolver } from './logout.resolver';

describe('LogoutResolver', () => {
	let module: TestingModule;
	let resolver: LogoutResolver;
	let authService: AuthService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				LogoutResolver,
				ConfigService,
				{
					provide: AuthService,
					useClass: AuthServiceMock,
				},
			],
		}).compile();

		resolver = module.get<LogoutResolver>(LogoutResolver);
		authService = module.get<AuthService>(AuthService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('asks auth service to revoke the token and returns it', async () => {
		const authServiceRevokeTokenSpy = jest.spyOn(
			authService,
			'revokeToken',
		);
		const res = await resolver.logout('refreshToken');
		expect(res).toEqual('refreshToken');
		expect(authServiceRevokeTokenSpy).toHaveBeenCalledWith('refreshToken');
	});
});
