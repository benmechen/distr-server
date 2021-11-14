import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransformableInfo } from 'logform';
import {
	WinstonModuleOptionsFactory,
	utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import winston from 'winston';

const SENSITIVE_FIELDS = [
	'password',
	'email',
	'firstName',
	'lastName',
	'phone',
];

@Injectable()
export class WinstonConfig implements WinstonModuleOptionsFactory {
	constructor(private configService: ConfigService) {}

	createWinstonModuleOptions() {
		const transports: winston.transport[] = [];

		if (
			this.configService.get<string>('LOG_FORMAT')?.toLowerCase() ===
			'json'
		)
			transports.push(this.addJSONLogger());
		else transports.push(this.addLocalLogger());

		const level = this.configService.get<string>('LOG_LEVEL') ?? 'debug';

		if (this.configService.get<boolean>('FILE_LOGGING'))
			transports.push(this.addFileLogger());

		const config: winston.LoggerOptions = {
			level,
			transports,
		};

		return config;
	}

	/**
	 * Generate a JSON console logger
	 * @returns JSON Logger Transport
	 */
	private addJSONLogger() {
		return new winston.transports.Console({
			format: winston.format.combine(
				this.filterSensitive(),
				winston.format.timestamp(),
				winston.format.json(),
			),
		});
	}

	private filterSensitive = winston.format((_info) => {
		const info = _info as Record<string, any>;

		SENSITIVE_FIELDS.forEach((field) => {
			if (info[field]) info[field] = this.maskSensitive(info[field]);
		});

		return info as TransformableInfo;
	});

	/**
	 * Mask sensitive values with a string of the same length
	 * @param _value Value to mask
	 */
	private maskSensitive(_value: any) {
		const value = String(_value);
		return Array(value.length).fill('*').join('');
	}

	/**
	 * Generate a local console logger
	 * @returns Local Logger Transport
	 */
	private addLocalLogger() {
		return new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp(),
				nestWinstonModuleUtilities.format.nestLike(),
			),
		});
	}

	/**
	 * Generate a file console logger
	 * @returns File Logger Transport
	 */
	private addFileLogger() {
		return new winston.transports.File({
			filename: 'logs/app.log',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json(),
			),
		});
	}
}
