import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenService } from '../common/token/token.service';
import { AuthService } from './auth.service';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly authService: AuthService,
		tokenService: TokenService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			// Get config from token service
			secretOrKey: tokenService.publicKey,
			issuer: tokenService.options.issuer,
			algorithms: tokenService.options.algorithms,
		});
	}

	async validate(payload: any) {
		const { sub } = payload;
		if (!sub) return null;
		return this.authService.validateUser(sub);
	}
}
