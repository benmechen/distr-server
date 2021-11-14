import { ObjectType, Field } from '@nestjs/graphql';
import { Tokens } from '../../auth/login/token.response';
import { User } from '../user.entity';

@ObjectType()
export class UserCreateResponse extends User {
	@Field({
		description:
			'Access and refresh tokens for the newly created user to allow them to login in straight away',
	})
	tokens: Tokens;
}
