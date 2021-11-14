import {
	NotificationOptionsFactory,
	NotificationOptions,
} from '@chelseaapps/notification';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { HelperService } from '../common/helper/helper.service';
import { LoggerFactory } from '../common/logger';
import { AWSHelperService } from '../common/token/aws.service';

@Injectable()
export class NotificationConfig implements NotificationOptionsFactory {
	private awsHelperService = new AWSHelperService();

	private logger: Logger;

	constructor(
		configService: ConfigService,
		private helperService: HelperService,
	) {
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

		const apnsKey = await this.awsHelperService.getSecret(
			this.helperService.getFromConfig<string>('APNS_KEY_NAME'),
		);

		const pushEnvironment = this.helperService
			.getFromConfig<string>('APNS_ENVIRONMENT')
			.toLowerCase();

		return {
			logger: this.logger,
			email: {
				host: this.helperService.getFromConfig<string>('SMTP_HOST'),
				port: this.helperService.getFromConfig<number>('SMTP_PORT'),
				from: this.helperService.getFromConfig<string>('EMAIL_FROM'),
				user: this.helperService.getFromConfig<string>('SMTP_USER'),
				password:
					this.helperService.getFromConfig<string>('SMTP_PASSWORD'),
			},
			sms: {
				aws: {
					region: this.helperService.getFromConfig<string>(
						'AWS_REGION',
					),
					accessKeyId:
						this.helperService.getFromConfig<string>(
							'AWS_ACCESS_KEY_ID',
						),
					secretAccessKey: this.helperService.getFromConfig<string>(
						'AWS_SECRET_ACCESS_KEY',
					),
				},
				sender: this.helperService.getFromConfig<string>('SMS_SENDER'),
				messageType: 'Transactional',
			},
			push: {
				enabled: true,
				production: ['prod', 'production'].includes(pushEnvironment),
				apns: {
					topic: this.helperService.getFromConfig<string>(
						'APNS_TOPIC',
					),
					key: apnsKey!,
					keyID: this.helperService.getFromConfig<string>(
						'APNS_KEY_ID',
					),
					teamID: this.helperService.getFromConfig<string>(
						'APNS_TEAM_ID',
					),
				},
			},
		};
	}
}
