import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { APIContext } from '../../apollo.config';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { Tokens } from './token.response';

@Resolver()
export class LoginResolver {
	constructor(
		private configService: ConfigService,
		private authService: AuthService,
		private userService: UserService,
	) {}

	@Mutation(() => Tokens, {
		nullable: true,
		description: "Get an access token using the user's email and password",
	})
	async login(
		@Args('email', {
			type: () => String,
			nullable: true,
			description: 'Deprectated, use username',
		})
		email: string | undefined,
		@Args('username', {
			type: () => String,
			nullable: true,
			description: 'Email or phone number',
		})
		username: string | undefined,
		@Args('password') password: string,
		@Context() context: APIContext,
	): Promise<Tokens | null> {
		// Get user from DB
		let user = await this.userService.findByEmailOrPhone(
			username ?? email ?? '',
		);
		if (!user) return null;

		// Users cannot access their account if it is locked, on timeout
		const isLocked = this.authService.isUserLocked(user);
		if (isLocked) throw isLocked;

		// Check if passwords match
		const valid = await this.userService.verifyPassword(user, password);
		if (!valid) {
			user = await this.authService.incrementLoginAttempts(user);
			return null;
		}

		user = await this.authService.resetLoginAttempts(user);

		// Create JWT tokens
		const accessToken = await this.authService.createToken(user, 'access');
		const refreshToken = await this.authService.createToken(
			user,
			'refresh',
		);

		context.res?.cookie(
			this.configService.get('REFRESH_TOKEN_COOKIE') ?? 'refreshToken',
			refreshToken,
			{
				expires: this.authService.getTokenExpiration().refreshToken,
				httpOnly: true,
				sameSite: 'strict',
			},
		);

		// Add refresh token to whitelist
		await this.authService.saveToken(user, refreshToken);

		return {
			accessToken,
			accessTokenExpiration:
				this.authService.getTokenExpiration().accessToken,
			refreshToken,
			role: user.role,
		};
	}
}
