import { ConfigService } from '@nestjs/config';
import { Plugin } from '@nestjs/apollo';
import {
	ApolloServerPlugin,
	GraphQLRequestContext,
	GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { Logger } from 'winston';
import { LoggerFactory } from '../logger';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
	private logger: Logger;

	constructor(configService: ConfigService) {
		this.logger = new LoggerFactory(configService).getLogger(
			LoggingPlugin.name,
		);
	}

	async requestDidStart(
		context: GraphQLRequestContext,
	): Promise<GraphQLRequestListener> {
		const start = Date.now();
		return {
			willSendResponse: async () => {
				if (context.operationName === 'IntrospectionQuery') return;

				this.logger.info(context.operationName ?? 'Processed request', {
					context: 'API',
					duration: Date.now() - start,
					operation: context.operationName,
					ip: context.context?.req?.ip,
				});
			},
		};
	}
}
