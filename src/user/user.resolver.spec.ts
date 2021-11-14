import { Test, TestingModule } from '@nestjs/testing';
import { APIErrorCode } from '../common/api.error';
import { HelperService } from '../common/helper/helper.service';
import { HelpersServiceMock } from '../common/helper/helper.service.mock';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserServiceMock } from './user.service.mock';
import { User } from './user.entity';

describe('UserResolver', () => {
	let module: TestingModule;
	let resolver: UserResolver;
	let testUser: User;
	const realHelpersService = new HelperService();

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserResolver,
				{
					provide: UserService,
					useClass: UserServiceMock,
				},
				{
					provide: HelperService,
					useClass: HelpersServiceMock,
				},
			],
		}).compile();

		resolver = module.get<UserResolver>(UserResolver);

		testUser = realHelpersService.createTestUser();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});

	describe('me', () => {
		it('returns the current user', async () => {
			const res = await resolver.me(testUser);
			expect(res).toEqual(testUser);
		});

		it('throws an error if no user is specified', async () => {
			await expect(async () => resolver.me(null as any)).rejects.toThrow(
				APIErrorCode.UNAUTHENTICATED,
			);
		});
	});
});
