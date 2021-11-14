import { Catch, ExceptionFilter } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { LoggerFactory } from './logger';

@Catch()
export class LogExceptionsHandlerFilter<T> implements ExceptionFilter {
	private logger: Logger;

	constructor(configService: ConfigService) {
		this.logger = new LoggerFactory(configService).getLogger(
			'LogExceptionsHandler',
		);
	}

	catch(exception: T) {
		if (exception instanceof Error) {
			this.logger.error(exception.message, { ...exception });
		}
		throw exception;
	}
}
