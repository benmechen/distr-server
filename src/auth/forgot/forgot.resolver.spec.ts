import * as faker from 'faker';
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
import { APIErrorCode } from '../../common/api.error';

describe('ForgotResolver', () => {
	let resolver: ForgotResolver;
	let codeService: CodeService;
	let userService: UserService;

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
		codeService = module.get<CodeService>(CodeService);
		userService = module.get<UserService>(UserService);
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('throws an error if verification failed', async () => {
		const password = faker.internet.password();
		const verification = faker.datatype.uuid();
		const phone = faker.phone.phoneNumber('07425######');
		const codeServiceIsVerificationValidSpy = jest
			.spyOn(codeService, 'isVerificationValid')
			.mockReturnValue(false);

		await expect(
			resolver.resetPassword(
				{
					password,
					verification,
					phone,
				},
				{ req: { ip: faker.internet.ip() } } as any,
			),
		).rejects.toThrow(APIErrorCode.CODE_INCORRECT);

		expect(codeServiceIsVerificationValidSpy).toHaveBeenCalledWith(
			verification,
			phone,
		);
	});

	it('throws an error if user not found', async () => {
		const password = faker.internet.password();
		const verification = faker.datatype.uuid();
		const phone = faker.phone.phoneNumber('07425######');

		jest.spyOn(codeService, 'isVerificationValid').mockReturnValue(true);
		const userServiceFindByPhoneSpy = jest
			.spyOn(userService, 'findByPhone')
			.mockResolvedValue(undefined);

		await expect(
			resolver.resetPassword(
				{
					password,
					verification,
					phone,
				},
				{ req: { ip: faker.internet.ip() } } as any,
			),
		).rejects.toThrow(APIErrorCode.NOT_FOUND.replace('resource', 'user'));

		expect(userServiceFindByPhoneSpy).toHaveBeenCalledWith(phone);
	});
});
