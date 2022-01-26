import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { APIErrorCode } from './common/api.error';

const formatError = (error: GraphQLError) => {
	let messages: string[];
	let code = 'INTERNAL_SERVER_ERROR';

	if (error.message === 'Unauthorized') {
		// Passport error
		code = 'UNAUTHENTICATED';
		messages = [APIErrorCode.UNAUTHENTICATED.valueOf()];
	} else if (error.message === 'Forbidden resource') {
		code = 'UNAUTHORISED';
		messages = [APIErrorCode.UNAUTHORISED.valueOf()];
	} else {
		if (error.message === 'Bad Request Exception') {
			// class-validator error
			code = 'BAD_INPUT';
			// eslint-disable-next-line
			error.message = error.extensions?.exception?.response?.message;
			// eslint-disable-next-line prefer-destructuring
		} else if (error.extensions?.code) code = error.extensions.code;

		messages = [error.message] ?? ['Internal Server Error'];
	}

	messages = messages
		.flat(2)
		.filter((message) => message)
		.map((message) => message.charAt(0).toUpperCase() + message.slice(1));

	const exception =
		process.env.NODE_ENV !== 'PRODUCTION'
			? error.extensions?.exception
			: undefined;

	const graphQLFormattedError: GraphQLFormattedError = {
		message: `[${code}]: ${messages.join(', ')}`,
		path: error.path,
		extensions: {
			code,
			message: messages,
			exception,
		},
	};
	return graphQLFormattedError;
};

export interface APIContext {
	req: Request;
	res: Response;
}

export const apolloConfig = (
	configService: ConfigService,
): GqlModuleOptions => {
	const corsOriginString = configService.get<string>('FRONTEND') ?? '';
	const corsOrigins = corsOriginString.split(',') ?? [];

	return {
		autoSchemaFile: true,
		sortSchema: true,
		context: ({ req, res }): APIContext => ({ req, res }),
		formatError,
		introspection: true,
		cors: {
			credentials: true,
			origin: corsOrigins,
		},
		installSubscriptionHandlers: true,
	};
};
