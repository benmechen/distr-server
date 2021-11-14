import { ConfigService } from '@nestjs/config';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from 'winston';
import { APIError, APIErrorCode } from '../../common/api.error';
import { Auth, GQLUser } from '../../common/decorators';
import { LoggerFactory } from '../../common/logger';
import { User, UserRole } from '../user.entity';
import { UserService } from '../user.service';

@Resolver()
export class UserDeleteResolver {
	private logger: Logger;

	constructor(
		private userService: UserService,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(
			UserDeleteResolver.name,
		);
	}

	@Mutation(() => User, {
		nullable: true,
		description: 'Delete a user',
	})
	@Auth()
	async userDelete(
		@Args('id') id: string,
		@GQLUser() currentUser: User,
		isAdmin = false,
	): Promise<User | null> {
		if (!this.userService.canModifyUser(currentUser, id, isAdmin))
			throw new APIError(APIErrorCode.UNAUTHORISED);

		const deletedUser = await this.userService.delete(id);
		if (!deletedUser) return null;
		return {
			...deletedUser,
			id,
		};
	}

	@Mutation(() => User, {
		nullable: true,
		description: 'Admin function to delete a user',
	})
	@Auth(UserRole.STAFF, UserRole.ADMIN)
	async adminUserDelete(
		@Args('id') id: string,
		@GQLUser() currentUser: User,
	): Promise<User | null> {
		this.logger.warn(`Admin deleting user [${currentUser.id}, ${id}]`);

		// Delete user
		return this.userDelete(id, currentUser, true);
	}

	@Mutation(() => [String], {
		nullable: true,
		description: 'Delete a set of users',
	})
	@Auth(UserRole.ADMIN)
	async adminUsersDelete(
		@Args({ name: 'ids', type: () => [ID] }) ids: string[],
	): Promise<string[] | null> {
		const deletedIDs = await Promise.all(
			ids.map(async (id) => {
				const user = await this.userService.delete(id);
				if (user) return id;
				return '';
			}),
		);
		return deletedIDs.filter((id) => id);
	}
}
