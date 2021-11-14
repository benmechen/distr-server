import { ConfigService } from '@nestjs/config';
import { Plugin } from '@nestjs/graphql';
import {
	ApolloServerPlugin,
	GraphQLRequestContext,
	GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { Logger } from 'winston';
import { APIContext } from '../../apollo.config';
import { LoggerFactory } from '../logger';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin<APIContext> {
	private logger: Logger;

	constructor(configService: ConfigService) {
		this.logger = new LoggerFactory(configService).getLogger(
			LoggingPlugin.name,
		);
	}

	requestDidStart(
		context: GraphQLRequestContext<APIContext>,
	): GraphQLRequestListener {
		const start = Date.now();
		return {
			willSendResponse: () => {
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
