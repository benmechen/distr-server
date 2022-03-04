import { ConfigService } from '@nestjs/config';
import { Plugin } from '@nestjs/apollo';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import {
	ApolloServerPlugin,
	GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { GraphQLError } from 'graphql';
import {
	fieldExtensionsEstimator,
	getComplexity,
	simpleEstimator,
} from 'graphql-query-complexity';
import { Logger } from 'winston';
import { LoggerFactory } from '../logger';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
	private logger: Logger;

	constructor(
		private gqlSchemaHost: GraphQLSchemaHost,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(
			ComplexityPlugin.name,
		);
	}

	async requestDidStart(): Promise<GraphQLRequestListener> {
		const { schema } = this.gqlSchemaHost;
		const _logger = this.logger;

		return {
			async didResolveOperation({ request, document }) {
				const maxComplexity = process.env.GQL_MAX_COMPLEXITY ?? 35;

				const complexity = getComplexity({
					schema,
					operationName: request.operationName,
					query: document,
					variables: request.variables,
					estimators: [
						fieldExtensionsEstimator(),
						simpleEstimator({ defaultComplexity: 1 }),
					],
				});

				_logger.silly(`Query complexity: ${complexity}`, {
					context: ComplexityPlugin.name,
					operation: request.operationName,
					complexity,
				});

				if (complexity >= maxComplexity) {
					_logger.warn(
						`Query too complex [${request.operationName}, ${complexity}]`,
						{
							context: ComplexityPlugin.name,
							operation: request.operationName,
							complexity,
						},
					);
					throw new GraphQLError(
						`Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
					);
				}
			},
		};
	}
}
