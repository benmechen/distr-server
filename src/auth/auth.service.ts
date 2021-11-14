import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { TokenService } from '../common/token/token.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Token } from '../common/token/token.entity';
import { APIError, APIErrorCode } from '../common/api.error';

type AuthTokenPayload = {
	sub: string;
	email: string;
	type: 'access' | 'refresh';
};

@Injectable()
export class AuthService {
	private accessTokenLifetime = '1m';

	private refreshTokenLifetime = '1 year';

	private linkTokenLifetime = '1h';

	constructor(
		private configService: ConfigService,
		@Inject(forwardRef(() => UserService))
		private userService: UserService,
		private tokenService: TokenService,
	) {
		this.accessTokenLifetime =
			this.configService.get('ACCESS_TOKEN_LIFETIME') ??
			this.accessTokenLifetime;
		this.refreshTokenLifetime =
			this.configService.get('REFRESH_TOKEN_LIFETIME') ??
			this.refreshTokenLifetime;
		this.linkTokenLifetime =
			this.configService.get('LINK_TOKEN_LIFETIME') ??
			this.linkTokenLifetime;
	}

	/**
	 * Make sure the user exists, and they have the required permissions
	 * @param id ID of the user to verify
	 */
	async validateUser(id: string): Promise<User | null> {
		const user = await this.userService.findByID(id);
		// Make sure user can access the API
		if (user) {
			if (this.isUserLocked(user)) return null;
			return user;
		}

		return null;
	}

	/**
	 * Create an access token for a user
	 * @param user User to grant access, or an object containing the user's ID and email
	 * @param expiry Expiry time in zeit/ms format
	 * @default "30d" 30 days default
	 */
	async createToken(
		user: User,
		type: 'access' | 'refresh',
		expiry?: string,
	): Promise<string>;

	async createToken(
		user: { id: string; email: string },
		type: 'access' | 'refresh',
		expiry?: string,
	): Promise<string>;

	async createToken(user: User, type: 'access' | 'refresh', expiry?: string) {
		const payload: AuthTokenPayload = {
			sub: user.id,
			email: user.email,
			type,
		};
		return this.tokenService.sign(
			payload,
			expiry ??
				(type === 'access'
					? this.accessTokenLifetime
					: this.refreshTokenLifetime),
		);
	}

	/**
	 * Verify that an access or refresh token is valid
	 * @param token Token to validate
	 * @param type Type of token (access or refresh)
	 */
	async verifyToken(
		token: string,
		type: 'access' | 'refresh' | 'resetpw' | 'activate',
	): Promise<AuthTokenPayload> {
		const payload = (await this.tokenService.verify(
			token,
		)) as AuthTokenPayload | null;
		if (!payload) throw new APIError(APIErrorCode.INVALID_TOKEN);

		// Make sure type matches
		if (payload.type !== type)
			throw new APIError(APIErrorCode.INVALID_TOKEN_TYPE, type);

		if (type === 'refresh') {
			const tokens = await this.tokenService.getTokensForUser(
				payload.sub,
			);
			if (!tokens.find((_token) => _token.token === token))
				throw new APIError(APIErrorCode.INVALID_TOKEN);
		}

		return payload;
	}

	/**
	 * Save a refresh token to the user's whitelist
	 * @param user User logging in
	 * @param token Refresh token to save
	 */
	async saveToken(user: User, token: string) {
		const issuedToken = new Token();
		issuedToken.token = token;
		issuedToken.user = user;
		return this.tokenService.save(issuedToken);
	}

	/**
	 * Revoke a token from the list of issued tokens
	 * @param token JWT token to revoke
	 */
	async revokeToken(token: string) {
		this.tokenService.delete(token);
	}

	/**
	 * Increase a user's failed login attempts by 1
	 * @param user User attempting to login
	 */
	async incrementLoginAttempts(user: User) {
		return this.userService.update(user, {
			loginAttempts: user.loginAttempts + 1,
			timeout: this.calculateTimeout(user.loginAttempts + 1),
		});
	}

	/**
	 * Reset a user's failed login attempts to 0
	 * @param user User logging in
	 */
	async resetLoginAttempts(user: User) {
		return this.userService.update(user, {
			loginAttempts: 0,
			timeout: undefined,
		});
	}

	/**
	 * Can the user access their account? ie. is it locked, on timeout, outside UK, etc.
	 * @param user User attempting to access
	 * @returns Boolean value stating if the user can access their account
	 */
	isUserLocked(user: User): boolean | APIError {
		const now = new Date();
		if (user.locked) return new APIError(APIErrorCode.ACCOUNT_LOCKED);
		if (user.timeout && now < user.timeout)
			return new APIError(
				APIErrorCode.ACCOUNT_TIMEOUT,
				this.getDateDifference(now, user.timeout),
			);
		return false;
	}

	/**
	 * Calculate the next allowed login date
	 * @param attemptsCount Number of failed login attempts
	 */
	calculateTimeout(attemptsCount: number): Date {
		const now = new Date();
		now.setSeconds(now.getSeconds() + this.halfExponential(attemptsCount));
		return now;
	}

	/**
	 * Calculate half of 2^c
	 * @param c Power to raise 2 to
	 */
	halfExponential(c: number) {
		const x = Math.floor(2 ** (c - 1));
		return x >= 0 ? x : 0;
	}

	/**
	 * Calculate the difference in seconds between two dates
	 * @param start First date
	 * @param end Second date
	 */
	getDateDifference = (start: Date, end: Date): string => {
		const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		let diff = seconds >= 1 ? `${seconds} seconds` : `1 second`;
		if (minutes >= 1) diff = `${minutes} minute(s)`;
		if (hours >= 1) diff = `${hours} hour(s)`;

		return diff;
	};

	/**
	 * Token lifetime getter
	 */
	getTokenExpiration() {
		const now = new Date();

		const accessTokenMilliseconds = ms(this.accessTokenLifetime);
		const refreshTokenMilliseconds = ms(this.refreshTokenLifetime);

		return {
			accessToken: this.addMilliseconds(now, accessTokenMilliseconds),
			refreshToken: this.addMilliseconds(now, refreshTokenMilliseconds),
		};
	}

	private addMilliseconds(date: Date, ms: number) {
		return new Date(date.getTime() + ms);
	}
}
