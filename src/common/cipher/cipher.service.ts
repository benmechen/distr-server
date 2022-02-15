import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { HelperService } from '../helper/helper.service';

@Injectable()
export class CipherService {
	private key: Buffer;

	private algorithm = 'aes-192-ctr';

	constructor(private readonly helperService: HelperService) {
		const password =
			this.helperService.getFromConfig<string>('CIPHER_PASSWORD');
		this.key = crypto.scryptSync(password, 'salt', 24);
	}

	encrypt(value: string) {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
		const encrypted = cipher.update(value, 'utf-8', 'hex');

		return [
			encrypted + cipher.final('hex'),
			Buffer.from(iv).toString('hex'),
		].join('|');
	}

	decrypt(encryptedValue: string) {
		const [encrypted, iv] = encryptedValue.split('|');
		if (!iv) throw new Error('IV not found');
		const decipher = crypto.createDecipheriv(
			this.algorithm,
			this.key,
			Buffer.from(iv, 'hex'),
		);
		return (
			decipher.update(encrypted, 'hex', 'utf-8') + decipher.final('utf-8')
		);
	}
}
