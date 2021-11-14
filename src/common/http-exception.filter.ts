import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseExceptionFilter } from '@nestjs/core';
import { Logger } from 'winston';
import { LoggerFactory } from './logger';

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
	private logger: Logger;

	constructor() {
		super();

		this.logger = new LoggerFactory(new ConfigService()).getLogger(
			'HttpExceptionFilter',
		);
	}

	catch(exception: HttpException, host: ArgumentsHost) {
		if (exception instanceof Error) {
			const { message, ...details } = exception;
			this.logger.error(message, { ...details });
		}

		super.catch(exception, host);
	}
}
