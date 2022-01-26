import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { Token } from './token.entity';

@Injectable()
export class TokenService {
	public publicKey: string;

	private privateKey: string;

	public options: JwtVerifyOptions = {
		issuer: 'tokens.${project-name}.com',
		algorithms: ['ES512'],
	};

	constructor(
		private jwtService: JwtService,
		@Inject('SECRETS')
		secrets: { private: string; public: string },
		@InjectRepository(Token)
		private tokenRepository: EntityRepository<Token>,
	) {
		if (!secrets.public) throw new Error('No public key found.');
		if (!secrets.private) throw new Error('No public key found.');

		this.publicKey = secrets.public;
		this.privateKey = secrets.private;
	}

	/**
	 * Sign a JWT token using system public/private key pair, with algorithm and issuer checks
	 * @param payload Data to store in JWT
	 * @param expiry Expiration time in zeit/ms
	 * @returns JWT string
	 */
	sign(
		payload: string | Record<string, unknown> | Buffer,
		expiry: string,
	): string {
		const token = this.jwtService.sign(payload, {
			issuer: this.options.issuer as string,
			algorithm: this.options.algorithms?.[0] ?? 'HS256',
			privateKey: this.privateKey,
			expiresIn: expiry,
		});
		return token;
	}

	/**
	 * Verify a token is valid, and decode its contents
	 * @param token JWT token to decode
	 * @returns Payload if valid, otherwise null
	 */
	verify(token: string) {
		try {
			return this.jwtService.verify(token, {
				...this.options,
				publicKey: this.publicKey,
			});
		} catch {
			return null;
		}
	}

	/**
	 * Get all tokens issued to a user
	 * @param userID ID of user to find for
	 */
	async getTokensForUser(userID: string): Promise<Token[]> {
		return this.tokenRepository.find({
			user: userID,
		});
	}

	/**
	 * Save a new token in the database
	 * @param token Token
	 */
	async save(token: Token): Promise<Token> {
		await this.tokenRepository.persistAndFlush(token);
		return token;
	}

	/**
	 * Remove and thus invalidate all tokens issued to a user
	 * @param userID ID of user to delete tokens for
	 */
	async deleteAll(userId: string) {
		return this.tokenRepository
			.createQueryBuilder('token')
			.delete()
			.where({ user: userId })
			.execute();
	}

	/**
	 * Delete a token from the issued tokens table
	 * @param token Token to query by
	 */
	async delete(token: string) {
		await this.tokenRepository.removeAndFlush({
			token,
		});
	}
}
