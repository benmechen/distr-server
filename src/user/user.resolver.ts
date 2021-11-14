import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../common/api.error';
import { BaseResolver } from '../common/base/base.resolver';
import { Auth, GQLUser } from '../common/decorators';
import { HelperService } from '../common/helper/helper.service';
import { UserCreateInput } from './create/create.input';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserUpdateInput } from './update/update.input';
import { User, UserConnection, UserRole } from './user.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver extends BaseResolver({
	entity: {
		single: User,
		connection: UserConnection as any,
	},
	service: {
		create: CreateUserDTO,
		update: UpdateUserDTO,
	},
	resolver: {
		create: {
			ref: UserCreateInput,
			roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER],
		},
		update: {
			ref: UserUpdateInput,
			roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER],
		},
	},
}) {
	constructor(userService: UserService, helperService: HelperService) {
		super(userService, helperService);
	}

	// Field resolvers
	@ResolveField()
	name(@Parent() user: User): string {
		return `${user.firstName} ${user.lastName}`;
	}

	// Override base resolver single item query
	@Query(() => User, {
		description: 'Get the currently logged in user',
	})
	@Auth()
	async me(@GQLUser() user: User): Promise<User> {
		if (!user) throw new APIError(APIErrorCode.UNAUTHENTICATED);
		return user;
	}
}
