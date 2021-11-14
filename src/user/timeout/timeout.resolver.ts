import { ConfigService } from '@nestjs/config';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from 'winston';
import { APIError, APIErrorCode } from '../../common/api.error';
import { Auth, GQLUser } from '../../common/decorators';
import { LoggerFactory } from '../../common/logger';
import { User, UserRole } from '../user.entity';
import { UserService } from '../user.service';

@Resolver()
export class UserTimeoutResolver {
	private logger: Logger;

	constructor(
		private userService: UserService,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(
			UserTimeoutResolver.name,
		);
	}

	@Mutation(() => User, {
		nullable: true,
		description: 'Set a self inflicted account timeout',
	})
	@Auth()
	async userSetTimeout(
		@Args('endDate') endDate: Date,
		@GQLUser() currentUser: User,
		isAdmin = false,
	): Promise<User> {
		return this.userService.setTimeout(currentUser, endDate, isAdmin);
	}

	@Mutation(() => User, {
		nullable: true,
		description: "Admin function to set a user's account timeout",
	})
	@Auth(UserRole.STAFF, UserRole.ADMIN)
	async adminUserSetTimeout(
		@Args('id') id: string,
		@Args('endDate') endDate: Date,
		@GQLUser() currentUser: User,
	): Promise<User> {
		this.logger.warn(
			`Admin setting timeout for user [${currentUser.id}, ${id}]`,
		);
		const user = await this.userService.findByID(id);
		if (!user) throw new APIError(APIErrorCode.NOT_FOUND);
		return this.userSetTimeout(endDate, user, true);
	}

	@Mutation(() => User, {
		nullable: true,
		description: "Admin function to remove a user's account timeout",
	})
	@Auth(UserRole.STAFF, UserRole.ADMIN)
	async adminUserRemoveTimeout(
		@Args('id') id: string,
		@GQLUser() currentUser: User,
	): Promise<User> {
		this.logger.warn(
			`Admin removing timeout for user [${currentUser.id}, ${id}]`,
		);

		const user = await this.userService.findByID(id);
		if (!user) throw new APIError(APIErrorCode.NOT_FOUND);
		return this.userService.removeTimeout(user);
	}
}
