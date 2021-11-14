import { ObjectType, Field } from '@nestjs/graphql';
import { UserRole } from '../../user/user.entity';

@ObjectType()
export class Tokens {
	@Field({
		description:
			'An access token allowing the user to access protected resources. Only valid for 5 minutes.',
	})
	accessToken: string;

	@Field({
		description: 'Date access token expires',
	})
	accessTokenExpiration: Date;

	@Field({
		description:
			'A refresh token allowing the user to request a new access token. Valid for 90 days.',
	})
	refreshToken: string;

	@Field({
		description: 'The role of the user.',
	})
	role: UserRole;
}
