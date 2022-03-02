import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserExistsResponse {
	@Field()
	exists: boolean;

	@Field({ nullable: true })
	name?: string;
}
