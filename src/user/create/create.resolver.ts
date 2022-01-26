import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../../common/api.error';
import { AuthService } from '../../auth/auth.service';
import { Auth, GQLUser } from '../../common/decorators';
import { User, UserRole } from '../user.entity';
import { UserService } from '../user.service';
import { AdminUserCreateInput } from './adminCreate.input';
import { UserCreateInput } from './create.input';
import { UserCreateResponse } from './create.response';
import { LoggerFactory } from '../../common/logger';

@Resolver()
export class UserCreateResolver {
	private logger: Logger;

	constructor(
		private userService: UserService,
		private authService: AuthService,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(
			UserCreateResolver.name,
		);
	}

	@Mutation(() => UserCreateResponse, {
		nullable: true,
		description: 'Sign up for an account',
	})
	async userCreate(
		@Args('input') input: UserCreateInput,
		role = UserRole.CUSTOMER,
	): Promise<UserCreateResponse> {
		if (await this.userService.isEmailRegistered(input.email))
			throw new APIError(APIErrorCode.USER_EXISTS_EMAIL);

		const user = await this.userService.create({
			...input,
			role,
		});

		this.userService.sendWelcomeEmail(user);

		const refreshToken = await this.authService.createToken(
			user,
			'refresh',
		);
		// Add refresh token to whitelist
		await this.authService.saveToken(user, refreshToken);

		return {
			...user,

			// Create JWT tokens so that the user can login straight away
			tokens: {
				accessToken: await this.authService.createToken(user, 'access'),
				accessTokenExpiration:
					this.authService.getTokenExpiration().accessToken,
				refreshToken,
				role: user.role,
			},
		};
	}

	@Mutation(() => UserCreateResponse, {
		nullable: true,
		description: 'Admin function to create a new user',
	})
	@Auth(UserRole.STAFF, UserRole.ADMIN)
	async adminUserCreate(
		@Args('input') input: AdminUserCreateInput,
		@GQLUser() currentUser: User,
	): Promise<UserCreateResponse> {
		this.logger.warn(
			`Admin creating user [${currentUser.id}, ${input.email}]`,
		);

		// Make sure user has permissions to create user with role

		if (!this.userService.canUserSetRole(currentUser, input.role))
			throw new APIError(APIErrorCode.UNAUTHORISED);
		// Only admins can set a user's role
		return this.userCreate(input, input.role);
	}
}
