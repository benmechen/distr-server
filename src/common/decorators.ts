import {
	applyDecorators,
	createParamDecorator,
	ExecutionContext,
	SetMetadata,
	UseGuards,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../user/user.entity';

/* eslint-disable */
/**
 * Get the response object
 */
export const GQLRes = createParamDecorator(
	(data, [root, args, ctx, info]): Response => ctx.res,
);

/**
 * Get the currently logged in user
 */
export const GQLUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) =>
		GqlExecutionContext.create(ctx).getContext().req.user,
);

/**
 * Apply a set of roles to a resolver
 * @param roles List of roles to use
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/**
 * Protect a query or resolver by applying this decorator
 * @param roles A list of user roles that have access to the resource.
 */
export const Auth = (..._roles: UserRole[]) => {
	const roles =
		_roles.length > 0
			? _roles
			: [UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER];
	return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
};

export const GetClient = createParamDecorator(
	(data, ctx: ExecutionContext): RequestClient => {
		const context = GqlExecutionContext.create(ctx).getContext();
		const headers = context.req.headers;

		const ip =
			headers['x-forwarded-for'] || context.req.connection.remoteAddress;

		return {
			ip,
			agent: headers['user-agent'],
		};
	},
);

export type RequestClient = {
	ip: string;
	agent: string;
};
