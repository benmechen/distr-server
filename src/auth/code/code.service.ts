import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import ms from 'ms';
import parsePhoneNumber from 'libphonenumber-js';
import { NotificationService } from '@chelseaapps/notification';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/mysql';
import { APIError, APIErrorCode } from '../../common/api.error';
import { TokenService } from '../../common/token/token.service';
import { Code } from './code.entity';
import CodeNotification from './code.notification';

export type OTCTokenPayload = {
	sub: string;
	code: string;
};

@Injectable()
export class CodeService {
	private lifetime: string;

	constructor(
		@InjectRepository(Code) private codeRepository: EntityRepository<Code>,
		private notificationService: NotificationService,
		private configService: ConfigService,
		private tokenService: TokenService,
	) {
		const lifetime = this.configService.get('OTC_LIFETIME') ?? '30m';
		this.lifetime = lifetime;
	}

	/**
	 * Generate a random code and send to phone number
	 * @param identifier Phone number
	 */
	async generate(identifier: string) {
		// Code must be unique. PG Driver will throw an error if trying to use the same code twice,
		// so we catch that error and retry with a different code. If after 100 tries we still haven't
		// succeeded, an error is thrown
		const code = await this.retry(100, async () => {
			const randomString = this.getRandomCode();
			const code = new Code(randomString, identifier);

			await this.codeRepository.persistAndFlush(code);
			return randomString;
		});

		// Send notification to user
		this.notificationService.send(new CodeNotification(identifier, code));

		return true;
	}

	async verify(code: string) {
		const existingCode = await this.findByCode(code);
		if (!existingCode) throw new APIError(APIErrorCode.CODE_INCORRECT);

		const validDate = existingCode.created.getTime() + ms(this.lifetime);
		if (Date.now() > validDate) {
			await this.delete(existingCode);
			throw new APIError(APIErrorCode.CODE_EXPIRED);
		}

		// Token is valid, create JWT
		const payload: OTCTokenPayload = {
			sub: existingCode.identifier,
			code,
		};

		// Delete code so it cannot be used again
		await this.delete(existingCode);

		return this.tokenService.sign(payload, '30 days');
	}

	/**
	 * Make sure a given verification token is valid and matches given phone number
	 * @param token JWT Token string
	 * @param phone Phone number given by user
	 */
	isVerificationValid(token: string, phone: string) {
		const payload = this.tokenService.verify(
			token,
		) as OTCTokenPayload | null;

		if (!payload) return false;
		return (
			this.formatPhoneNumber(payload.sub) ===
			this.formatPhoneNumber(phone)
		);
	}

	/**
	 * Clean up old codes, otherwise we'd run out of unique codes
	 */
	@Cron(CronExpression.EVERY_12_HOURS)
	async cleanUp() {
		const expiry = new Date(Date.now() - ms('12 hours'));

		// Get all codes older than a day
		const expiredCodes = await this.codeRepository.find({
			// created: LessThanOrEqual(expiry.toISOString()),
			created: {
				$lte: expiry,
			},
		});

		// Delete codes
		await Promise.all(expiredCodes.map((code) => this.delete(code)));
	}

	/**
	 * Search for an existing code
	 * @param code Code to query by
	 */
	async findByCode(code: string) {
		return this.codeRepository.findOne({
			code,
		});
	}

	async delete(entity: Code | string) {
		let code: Code | null;
		if (typeof entity === 'string') {
			// ID was passed in
			code = await this.findByCode(entity);
		} else {
			// Otherwise code was passed in
			code = entity;
		}
		return code ? this.codeRepository.removeAndFlush(code) : null;
	}

	/**
	 * Get an `n` digit long code
	 * @param digits Length of code
	 */
	getRandomCode(digits = 6) {
		return Math.random().toFixed(digits).split('.')[1];
	}

	/**
	 * Try a function again if it fails
	 * @param maxRetries Max times to try again
	 * @param fn Function to try
	 */
	private async retry(
		maxRetries: number,
		fn: () => Promise<string>,
	): Promise<string> {
		return fn().catch((err) => {
			if (maxRetries <= 0) {
				throw err;
			}
			return this.retry(maxRetries - 1, fn);
		});
	}

	/**
	 * Format phone number to E164
	 * @param phoneNumber Phone number input
	 */
	private formatPhoneNumber(phoneNumber?: string): string | undefined {
		return parsePhoneNumber(phoneNumber ?? '', 'GB')?.format('E.164');
	}
}
