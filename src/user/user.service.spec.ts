import * as faker from 'faker';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
	NotificationService,
	NotificationServiceMock,
} from '@chelseaapps/notification';
import { HelperService } from '../common/helper/helper.service';
import { TokenService } from '../common/token/token.service';
import { User, UserRepositoryMock, UserRole } from './user.entity';
import { UserService } from './user.service';
import { HelpersServiceMock } from '../common/helper/helper.service.mock';
import { TokenServiceMock } from '../common/token/token.service.mock';
import { APIErrorCode } from '../common/api.error';
import { CreateUserDTO } from './create/create-user.dto';

describe('UserService', () => {
	let module: TestingModule;
	let service: UserService;
	let realHelpersService: HelperService;
	let userRepository: Repository<User>;
	let helpersService: HelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: getRepositoryToken(User),
					useClass: UserRepositoryMock,
				},
				{
					provide: ConfigService,
					useClass: ConfigService,
				},
				{
					provide: HelperService,
					useClass: HelpersServiceMock,
				},
				{
					provide: TokenService,
					useClass: TokenServiceMock,
				},
				{
					provide: NotificationService,
					useClass: NotificationServiceMock,
				},
			],
		}).compile();

		service = module.get<UserService>(UserService);
		userRepository = module.get(getRepositoryToken(User));
		helpersService = module.get(HelperService);
		realHelpersService = new HelperService();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findByID', () => {
		it('finds an entity by its ID succesfully', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.id = faker.datatype.uuid();

			// Override helper function
			const helpersServiceIsValidIDSpy = jest
				.spyOn(helpersService, 'isValidID')
				.mockReturnValue(true);
			// Return user
			const userRepositoryFindOneSpy = jest
				.spyOn(userRepository, 'findOne')
				.mockResolvedValue(testUser);

			const foundUser = await service.findByID(testUser.id);
			expect(foundUser).toEqual(expect.objectContaining(testUser));
			expect(userRepositoryFindOneSpy).toHaveBeenCalledWith(testUser.id);
			expect(helpersServiceIsValidIDSpy).toHaveBeenCalledWith(
				testUser.id,
			);
		});

		it('does not return a user with an invalid ID', async () => {
			// Override helper function to return false
			const helpersServiceIsValidIDSpy = jest
				.spyOn(helpersService, 'isValidID')
				.mockReturnValue(false);
			// Spy on func to make sure it isn't reached
			const userRepositoryFindOneSpy = jest.spyOn(
				userRepository,
				'findOne',
			);

			await expect(async () =>
				service.findByID('invalid-uuid'),
			).rejects.toThrow(APIErrorCode.INVALID_ID);
			expect(userRepositoryFindOneSpy).toHaveBeenCalledTimes(0);
			expect(helpersServiceIsValidIDSpy).toHaveBeenCalledWith(
				'invalid-uuid',
			);
		});
	});

	describe('findByEmail', () => {
		it('returns a user by their email', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.id = faker.datatype.uuid();

			// Return user
			const userRepositoryFindOneSpy = jest
				.spyOn(userRepository, 'findOne')
				.mockResolvedValue(testUser);

			const foundUser = await service.findByEmail(testUser.email);
			expect(foundUser).toEqual(expect.objectContaining(testUser));
			expect(userRepositoryFindOneSpy).toHaveBeenCalledWith({
				email: testUser.email.toLowerCase(),
			});
		});

		it('returns nothing if no user is found', async () => {
			// Return user
			const userRepositoryFindOneSpy = jest
				.spyOn(userRepository, 'findOne')
				.mockResolvedValue(undefined);

			const email = faker.internet.email();
			const foundUser = await service.findByEmail(email);
			expect(foundUser).toBeUndefined();
			expect(userRepositoryFindOneSpy).toHaveBeenCalledWith({
				email: email.toLowerCase(),
			});
		});
	});

	describe('isEmailRegistered', () => {
		it('returns true for an existing user', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.id = faker.datatype.uuid();

			// Return user
			const userRepositoryFindOneSpy = jest
				.spyOn(userRepository, 'findOne')
				.mockResolvedValue(testUser);

			const foundUser = await service.isEmailRegistered(testUser.email);
			expect(foundUser).toEqual(true);
			expect(userRepositoryFindOneSpy).toHaveBeenCalledWith({
				email: testUser.email.toLowerCase(),
			});
		});

		it('returns false if no user is found', async () => {
			// Return user
			const userRepositoryFindOneSpy = jest
				.spyOn(userRepository, 'findOne')
				.mockResolvedValue(undefined);

			const email = faker.internet.email();
			const foundUser = await service.isEmailRegistered(email);
			expect(foundUser).toEqual(false);
			expect(userRepositoryFindOneSpy).toHaveBeenCalledWith({
				email: email.toLowerCase(),
			});
		});
	});

	describe('findAll', () => {
		it('returns a list of users', async () => {
			// Create dummy user
			const dummy = {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName(),
				email: faker.internet.email(),
				password: faker.internet.password(),
				created: new Date(),
				updated: new Date(),
			};
			const testUsers = [
				User.of({
					...dummy,
					id: faker.datatype.uuid(),
				}),
			];

			// Return user
			const userRepositoryFindSpy = jest
				.spyOn(userRepository, 'find')
				.mockResolvedValue(testUsers);

			const foundUser = await service.findAll();
			expect(foundUser).toEqual(expect.arrayContaining(testUsers));
			expect(userRepositoryFindSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('create', () => {
		it('return a user', async () => {
			// Create dummy user
			const dummy: CreateUserDTO = {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName(),
				email: faker.internet.email(),
				password: faker.internet.password(),
				phone: faker.phone.phoneNumber('07425140###'),
				role: UserRole.CUSTOMER,
				tos: {
					agent: faker.random.word(),
					date: new Date(),
					ip: faker.internet.ip(),
				},
			};

			const dummyHashed = {
				...dummy,
				password: await bcrypt.hash(dummy.password, 12),
			};

			// Return user
			const userRepositorySaveSpy = jest
				.spyOn(userRepository, 'save')
				.mockResolvedValue(User.of(dummyHashed));

			const createdUser = await service.create(dummy);
			expect(createdUser).toEqual(expect.objectContaining(dummyHashed));
			expect(userRepositorySaveSpy).toHaveBeenCalledTimes(1);

			// Make sure password was hashed correctly
			const correct = await bcrypt.compare(
				dummy.password,
				createdUser.password,
			);
			expect(correct).toEqual(true);
		});
	});

	describe('update', () => {
		it('returns a user with updated details', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.password = await bcrypt.hash(
				faker.internet.password(),
				12,
			);

			const input = {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName(),
				email: faker.internet.email(),
			};

			const updatedDetails = {
				...testUser,
				...input,
			};

			// Return user
			const userRepositorySaveSpy = jest
				.spyOn(userRepository, 'save')
				.mockResolvedValue(User.of(updatedDetails));

			const updatedUser = await service.update(testUser, input);
			expect(updatedUser).toEqual(
				expect.objectContaining(updatedDetails),
			);

			expect(userRepositorySaveSpy).toHaveBeenCalledWith(updatedDetails);
		});

		it('rehashes a new password when given', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.password = await bcrypt.hash(
				faker.internet.password(),
				12,
			);

			const input = {
				password: faker.internet.password(),
			};

			const updatedDetails = {
				...testUser,
				password: await bcrypt.hash(input.password, 12),
			};

			// Return user
			const userRepositorySaveSpy = jest
				.spyOn(userRepository, 'save')
				.mockResolvedValue(User.of(updatedDetails));

			const updatedUser = await service.update(testUser, input);
			expect(updatedUser).toEqual(
				expect.objectContaining(updatedDetails),
			);

			expect(userRepositorySaveSpy).toHaveBeenCalledTimes(1);
			// Make sure password was hashed correctly
			const incorrect = await bcrypt.compare(
				testUser.password,
				updatedUser.password,
			);
			expect(incorrect).toEqual(false);
			const correct = await bcrypt.compare(
				input.password,
				updatedUser.password,
			);
			expect(correct).toEqual(true);
		});
	});

	describe('delete', () => {
		it('throws an error if cannot delete user', async () => {
			// Return user
			const testUser = realHelpersService.createTestUser();
			jest.spyOn(service, 'findByID').mockResolvedValue(testUser);
			jest.spyOn(service, 'canDeleteUser').mockResolvedValue(false);

			await expect(service.delete(testUser.id)).rejects.toThrow(
				APIErrorCode.CANNOT_DELETE,
			);
		});

		it('deletes a user by their ID', async () => {
			// Return user
			const testUser = realHelpersService.createTestUser();
			const userServiceFindByIDSpy = jest
				.spyOn(service, 'findByID')
				.mockResolvedValue(testUser);
			jest.spyOn(service, 'canDeleteUser').mockResolvedValue(true);
			const userRepositorySaveSpy = jest
				.spyOn(userRepository, 'save')
				.mockResolvedValue(testUser);
			const userRepositoryDeleteSpy = jest
				.spyOn(userRepository, 'softRemove')
				.mockResolvedValue(testUser);

			const deletedUser = await service.delete(testUser.id);
			expect(deletedUser).toEqual(testUser);

			expect(userServiceFindByIDSpy).toHaveBeenCalledWith(testUser.id);
			expect(userRepositorySaveSpy).toHaveBeenCalledWith({
				...testUser,
				firstName: 'Deleted',
				lastName: 'User',
				email: `${testUser.id}@deleted`,
				password: '',
				phone: `${testUser.id}@deleted`,
				issuedTokens: [],
				locked: true,
				active: false,
			});
			expect(userRepositoryDeleteSpy).toHaveBeenCalledWith(testUser);
		});

		it('deletes a user using an instance', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.password = await bcrypt.hash(
				faker.internet.password(),
				12,
			);

			jest.spyOn(service, 'canDeleteUser').mockResolvedValue(true);
			const userRepositorySaveSpy = jest
				.spyOn(userRepository, 'save')
				.mockResolvedValue(testUser);
			// Return user
			const userRepositoryRemoveSpy = jest
				.spyOn(userRepository, 'softRemove')
				.mockResolvedValue(testUser);

			const deletedUser = await service.delete(testUser);
			expect(deletedUser).toEqual(testUser);
			expect(userRepositorySaveSpy).toHaveBeenCalledWith({
				...testUser,
				firstName: 'Deleted',
				lastName: 'User',
				email: `${testUser.id}@deleted`,
				password: '',
				phone: `${testUser.id}@deleted`,
				issuedTokens: [],
				locked: true,
				active: false,
			});
			expect(userRepositoryRemoveSpy).toHaveBeenCalledWith(testUser);
		});
	});

	describe('verifyPassword', () => {
		it('returns true for a matching password', async () => {
			const password = faker.internet.password();
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.password = await bcrypt.hash(password, 12);

			const res = await service.verifyPassword(testUser, password);
			expect(res).toEqual(true);
		});

		it('returns false for a non-matching password', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.password = await bcrypt.hash(
				faker.internet.password(),
				12,
			);

			const res = await service.verifyPassword(
				testUser,
				faker.internet.password(),
			);
			expect(res).toEqual(false);
		});

		it('returns false for an empty password', async () => {
			// Create dummy user
			const testUser = realHelpersService.createTestUser();
			testUser.password = await bcrypt.hash(
				faker.internet.password(),
				12,
			);

			const res = await service.verifyPassword(testUser, '');
			expect(res).toEqual(false);
		});
	});

	describe('canUserSetRole', () => {
		it('returns true for a customer role', () => {
			const testUser = realHelpersService.createTestUser();
			const canSetRole = service.canUserSetRole(
				{
					...testUser,
					role: UserRole.CUSTOMER,
				},
				UserRole.CUSTOMER,
			);
			expect(canSetRole).toEqual(true);
		});

		it('returns true for a staff role by a staff user', () => {
			const testUser = realHelpersService.createTestUser();
			const canSetRole = service.canUserSetRole(
				{
					...testUser,
					role: UserRole.STAFF,
				},
				UserRole.STAFF,
			);
			expect(canSetRole).toEqual(true);
		});

		it('returns true for a admin role by an admin user', () => {
			const testUser = realHelpersService.createTestUser();
			const canSetRole = service.canUserSetRole(
				{
					...testUser,
					role: UserRole.ADMIN,
				},
				UserRole.ADMIN,
			);
			expect(canSetRole).toEqual(true);
		});

		it('returns false for a staff role by a customer user', () => {
			const testUser = realHelpersService.createTestUser();
			const canSetRole = service.canUserSetRole(
				{
					...testUser,
					role: UserRole.CUSTOMER,
				},
				UserRole.STAFF,
			);
			expect(canSetRole).toEqual(false);
		});

		it('returns false for an admin role by a customer user', () => {
			const testUser = realHelpersService.createTestUser();
			const canSetRole = service.canUserSetRole(
				{
					...testUser,
					role: UserRole.CUSTOMER,
				},
				UserRole.ADMIN,
			);
			expect(canSetRole).toEqual(false);
		});

		it('returns false for an admin role by a staff user', () => {
			const testUser = realHelpersService.createTestUser();
			const canSetRole = service.canUserSetRole(
				{
					...testUser,
					role: UserRole.STAFF,
				},
				UserRole.ADMIN,
			);
			expect(canSetRole).toEqual(false);
		});
	});

	describe('canModifyUser', () => {
		it('returns true for matching IDs', () => {
			const testUser = realHelpersService.createTestUser();
			const canModifyUser = service.canModifyUser(
				testUser,
				testUser.id,
				false,
			);
			expect(canModifyUser).toEqual(true);
		});

		it('returns true for an admin', () => {
			const testUser = realHelpersService.createTestUser();
			const canModifyUser = service.canModifyUser(
				testUser,
				faker.datatype.uuid(),
				true,
			);
			expect(canModifyUser).toEqual(true);
		});

		it('returns false for not an admin and non matching IDs', () => {
			const testUser = realHelpersService.createTestUser();
			const canModifyUser = service.canModifyUser(
				testUser,
				faker.datatype.uuid(),
				false,
			);
			expect(canModifyUser).toEqual(false);
		});
	});
});
