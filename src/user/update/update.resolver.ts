import { ConfigService } from '@nestjs/config';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from 'winston';
import { APIError, APIErrorCode } from '../../common/api.error';
import { Auth, GQLUser } from '../../common/decorators';
import { LoggerFactory } from '../../common/logger';
import { User, UserRole } from '../user.entity';
import { UserService } from '../user.service';
import { AdminUserUpdateInput } from './adminUpdate.input';
import { UserUpdateInput } from './update.input';

@Resolver()
export class UserUpdateResolver {
	private logger: Logger;

	constructor(
		private userService: UserService,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(
			UserUpdateResolver.name,
		);
	}

	@Mutation(() => User, {
		description: "Update an existing customer's details",
		nullable: true,
	})
	@Auth()
	async userUpdate(
		@Args('id', { type: () => ID }) id: string,
		@Args('input') input: UserUpdateInput,
		@GQLUser() currentUser: User,
		isAdmin = false,
	): Promise<User | null> {
		if (!this.userService.canModifyUser(currentUser, id, isAdmin))
			throw new APIError(APIErrorCode.UNAUTHORISED);

		const user = await this.userService.findByID(id);
		if (!user) throw new APIError(APIErrorCode.NOT_FOUND, 'user');

		// Make sure no user already exists with the given email
		if (
			input.email &&
			input.email !== user.email &&
			(await this.userService.isEmailRegistered(input.email))
		)
			throw new APIError(APIErrorCode.USER_EXISTS_EMAIL);

		return this.userService.update(user, input);
	}

	@Mutation(() => User, {
		nullable: true,
		description: 'Admin function to update a user',
	})
	@Auth(UserRole.STAFF, UserRole.ADMIN)
	async adminUserUpdate(
		@Args('id') id: string,
		@Args('input') input: AdminUserUpdateInput,
		@GQLUser() currentUser: User,
	): Promise<User | null> {
		this.logger.warn(`Admin updating user [${currentUser.id}, ${id}]`);

		// Make sure user has permissions to create user with role
		if (
			input.role &&
			!this.userService.canUserSetRole(currentUser, input.role)
		)
			throw new APIError(APIErrorCode.UNAUTHORISED);

		// Update user, skipping password check
		return this.userUpdate(id, input, currentUser, true);
	}
}
