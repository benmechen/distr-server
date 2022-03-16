import {
	NotificationOptionsFactory,
	NotificationOptions,
} from '@chelseaapps/notification';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { LoggerFactory } from '../common/logger';

@Injectable()
export class NotificationConfig implements NotificationOptionsFactory {
	private logger: Logger;

	constructor(configService: ConfigService) {
		this.logger = new LoggerFactory(configService).getLogger(
			'NotificationService',
		);
	}

	/**
	 * Configure notification module using environment variables
	 * @returns Notification module options
	 */
	async createNotificationOptions(): Promise<NotificationOptions> {
		// Disable when testing
		if (process.env.NODE_ENV === 'test')
			return {
				logger: this.logger,
				email: {
					enabled: false,
				},
				sms: {
					enabled: false,
				},
				push: {
					enabled: false,
				},
			};

		return {
			logger: this.logger,
			email: {
				enabled: false,
			},
			sms: {
				enabled: false,
			},
			push: {
				enabled: false,
			},
		};
	}
}
