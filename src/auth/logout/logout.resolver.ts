import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { APIContext } from '../../apollo.config';
import { AuthService } from '../auth.service';

@Resolver()
export class LogoutResolver {
	constructor(
		private configService: ConfigService,
		private authService: AuthService,
	) {}

	@Mutation(() => String, {
		description: 'Revoke a refresh token',
		nullable: true,
	})
	async logout(
		@Args('token', {
			description: 'Refresh token to revoke',
			nullable: true,
		})
		_refreshToken?: string,
		@Context() context?: APIContext,
	): Promise<string> {
		// If no token given, fallback to HttpOnly cookie
		const cookieName =
			this.configService.get('REFRESH_TOKEN_COOKIE') ?? 'refreshToken';
		const refreshToken =
			_refreshToken ?? context?.req?.cookies?.[cookieName];

		// Clear cookie
		context?.res.clearCookie(cookieName);

		if (refreshToken) await this.authService.revokeToken(refreshToken);

		return refreshToken;
	}
}
