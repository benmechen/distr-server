import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import parsePhoneNumber from 'libphonenumber-js';
import { NotificationService } from '@chelseaapps/notification';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/mysql';
import { APIError, APIErrorCode } from '../common/api.error';
import { BaseService } from '../common/base/base.service';
import { HelperService } from '../common/helper/helper.service';
import UserCreatedNotification from './notifications/created.notification';
import { User, UserRole } from './user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';

@Injectable()
export class UserService extends BaseService<
	User,
	CreateUserDTO,
	UpdateUserDTO
> {
	constructor(
		@InjectRepository(User) private userRepository: EntityRepository<User>,
		helperService: HelperService,
		configService: ConfigService,
		private notificationService: NotificationService,
	) {
		super(UserService.name, userRepository, helperService, configService);
	}

	/**
	 * Find a user in the data store by their email
	 * @param email Email to query
	 */
	async findByEmail(email: string): Promise<User | null> {
		return this.userRepository.findOne({ email: email.toLowerCase() });
	}

	/**
	 * Find a user in the data store by their username (email or phone)
	 * @param username Username to query
	 */
	async findByEmailOrPhone(username: string): Promise<User | null> {
		return this.userRepository.findOne({
			$or: [
				{
					email: username.toLowerCase(),
				},
				{
					phone: this.formatPhoneNumber(username),
				},
			],
		});
	}

	/**
	 * Check if an email has already been registed
	 * @param email Email to check
	 */
	async isEmailRegistered(email: string): Promise<boolean> {
		return !!(await this.findByEmail(email));
	}

	/**
	 * Search for a user, and return a paginated list
	 * @param take Number of users to return
	 * @param skip Number of results to skip for pagination
	 * @param query Search query (first & last names, email, phone)
	 */
	// async search(
	// 	take?: number,
	// 	skip?: number,
	// 	sort?: ConnectionSort<User>,
	// 	filter?: ConnectionFilter,
	// ) {
	// 	const query = new SearchQuery<User>(this.userRepository)
	// 		.order(sort)
	// 		.filter(filter?.fields)
	// 		.search(
	// 			[
	// 				{
	// 					field: 'id',
	// 					type: 'id',
	// 				},
	// 				{
	// 					field: 'firstName',
	// 				},
	// 				{
	// 					field: 'lastName',
	// 				},
	// 				{
	// 					field: 'email',
	// 				},
	// 				{
	// 					field: 'phone',
	// 				},
	// 			],
	// 			filter?.query,
	// 		);

	// 	return query.execute(take, skip);
	// }

	/**
	 * Create a new user and save to the data store
	 * @param input UserInput object
	 */
	async create(input: CreateUserDTO): Promise<User> {
		return super.create({
			...input,
			password: await hash(input.password, 12),
		});
	}

	/**
	 * Send a welcome email containing a JWT activation token to a new user
	 * @param user Created user
	 * @param token JWT activation token
	 */
	sendWelcomeEmail(user: User) {
		const email = new UserCreatedNotification(user);
		this.notificationService.send(email);
	}

	/**
	 * Update a user object and save to the data store
	 * Only updates fields that are set in the input
	 * @param user User object to update
	 * @param input Input containing requiring update
	 */
	async update(user: User, input: UpdateUserDTO): Promise<User> {
		return super.update(user, {
			...input,
			// Hash password, if given
			password: input.password
				? await hash(input.password, 12)
				: user.password,
		});
	}

	/*
	 /* Activate a user and save to the data store
	 * @param user User object to update
	 * @param input Input containing requiring update
	 */
	async activate(user: User, flush = true): Promise<User> {
		user.active = true;

		if (flush) await this.repository.persistAndFlush(user);
		else this.repository.persist(user);

		return user;
	}

	/**
	 * Verify that the given password matches the user's current password
	 * @param user User to check against
	 * @param password Inputted password
	 */
	async verifyPassword(user: User, password: string): Promise<boolean> {
		return compare(password, user.password);
	}

	/**
	 * Set a user's account timeout
	 * @param user User to set timeout to
	 * @param endDate Date timeout finishes
	 * @param isAdmin If user is admin or not
	 */
	async setTimeout(
		user: User,
		endDate: Date,
		isAdmin: boolean,
	): Promise<User> {
		const now = new Date();
		if (!isAdmin && now > endDate)
			throw new APIError(APIErrorCode.INVALID_DATE);

		return this.update(user, { timeout: endDate });
	}

	/**
	 * Remove a user's account timeout
	 * @param user User to set timeout to
	 */
	async removeTimeout(user: User) {
		return this.update(user, { timeout: null });
	}

	/**
	 * Can the current user modify the requested user (ie. are they an admin or are the IDs equal)
	 * @param currentUser Current User
	 * @param isAdmin Is it an admin request
	 * @param id ID of the user to be modified
	 */
	canModifyUser(currentUser: User, id: string, isAdmin = false) {
		// Unless an admin, the user can only modify themselves
		return currentUser && (isAdmin || currentUser.id === id);
	}

	/**
	 * Determine if a user has permission to set another user's role
	 * @param currentUser Current User
	 * @param role Role to be set
	 * @returns An error that can be thrown, or true
	 */
	canUserSetRole(currentUser: User, role: UserRole): boolean {
		if (role !== UserRole.CUSTOMER) {
			// Admins and staff can create staff accounts
			// Only admins can create admin accounts
			if (
				!currentUser ||
				(role === UserRole.STAFF &&
					currentUser.role !== UserRole.STAFF &&
					currentUser.role !== UserRole.ADMIN) ||
				(role === UserRole.ADMIN && currentUser.role !== UserRole.ADMIN)
			)
				return false;
		}
		return true;
	}

	/**
	 * Format phone number to E164
	 * @param phoneNumber Phone number input
	 */
	formatPhoneNumber(phoneNumber?: string): string | undefined {
		return parsePhoneNumber(phoneNumber ?? '', 'GB')?.format('E.164');
	}
}
