import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../../common/api.error';
import { APIContext } from '../../apollo.config';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { Tokens } from '../login/token.response';

@Resolver()
export class RefreshResolver {
	constructor(
		private configService: ConfigService,
		private authService: AuthService,
		private userService: UserService,
	) {}

	@Mutation(() => Tokens, {
		nullable: true,
		description: 'Get a new access token from a valid refresh token',
	})
	async refresh(
		@Args('token', { description: 'Refresh token', nullable: true })
		_refreshToken?: string,
		@Context() context?: APIContext,
	): Promise<Tokens | null> {
		// If no token given, fallback to HttpOnly cookie
		const refreshToken =
			_refreshToken ??
			context?.req?.cookies?.[
				this.configService.get('REFRESH_TOKEN_COOKIE') ?? 'refreshToken'
			];

		if (!refreshToken) throw new APIError(APIErrorCode.INVALID_TOKEN);

		// Make sure token is valid, and was issued to that user
		const payload = await this.authService.verifyToken(
			refreshToken,
			'refresh',
		);

		const user = await this.userService.findByID(payload?.sub);
		if (!user) throw new APIError(APIErrorCode.NOT_FOUND);

		// Users cannot access their account if it is locked, on timeout or outside UK
		const isLocked = this.authService.isUserLocked(user);
		if (isLocked) throw isLocked;

		// Revoke current token to rotate
		await this.authService.revokeToken(refreshToken);

		// Token is valid, issue a new access token
		return {
			refreshToken: await this.authService.createToken(user, 'refresh'),
			accessToken: await this.authService.createToken(
				{
					id: payload.sub,
					email: payload.email,
				},
				'access',
			),
			accessTokenExpiration:
				this.authService.getTokenExpiration().accessToken,
			role: user.role,
		};
	}
}
