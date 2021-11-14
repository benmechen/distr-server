import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user.service';
import { UserDeleteResolver } from './delete.resolver';
import { HelperService } from '../../common/helper/helper.service';
import { UserServiceMock } from '../user.service.mock';

describe('DeleteResolver', () => {
	let module: TestingModule;
	let resolver: UserDeleteResolver;
	let userService: UserService;
	let helperService: HelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserDeleteResolver,
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				ConfigService,
			],
		}).compile();

		resolver = module.get<UserDeleteResolver>(UserDeleteResolver);
		userService = module.get<UserService>(UserService);
		helperService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	it('calls user service delete', async () => {
		const testUser = helperService.createTestUser();

		const userServiceCanUserModifySpy = jest
			.spyOn(userService, 'canModifyUser')
			.mockReturnValue(true);
		const userServiceDeleteSpy = jest
			.spyOn(userService, 'delete')
			.mockResolvedValue(testUser);

		const res = await resolver.userDelete(testUser.id, testUser);

		expect(res).toEqual(testUser);
		expect(userServiceCanUserModifySpy).toHaveBeenCalledWith(
			testUser,
			testUser.id,
			false,
		);
		expect(userServiceDeleteSpy).toHaveBeenCalledWith(testUser.id);
	});
});
