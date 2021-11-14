import { ConfigService } from '@nestjs/config';
import winston, { createLogger } from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export class LoggerFactory {
	constructor(private configService: ConfigService) {}

	getLogger(context: string) {
		return createLogger({
			...this.getConfig(),
			defaultMeta: {
				context,
			},
		});
	}

	private getConfig() {
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
				winston.format.timestamp(),
				winston.format.json(),
			),
		});
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
