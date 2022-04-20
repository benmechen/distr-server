import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
	NotificationService,
	NotificationServiceMock,
} from '@chelseaapps/notification';
import { UserService } from '../../user/user.service';
import { UserServiceMock } from '../../user/user.service.mock';
import { AuthService } from '../auth.service';
import { AuthServiceMock } from '../auth.service.mock';
import { CodeService } from '../code/code.service';
import { CodeServiceMock } from '../code/code.service.mock';
import { ForgotResolver } from './forgot.resolver';

describe('ForgotResolver', () => {
	let resolver: ForgotResolver;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ForgotResolver,
				{
					provide: CodeService,
					useClass: CodeServiceMock,
				},
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				{
					provide: AuthService,
					useClass: AuthServiceMock,
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
			],
		}).compile();

		resolver = module.get<ForgotResolver>(ForgotResolver);
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});
});
