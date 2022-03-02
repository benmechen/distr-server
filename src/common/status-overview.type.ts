import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StatusOverview {
	@Field(() => Int)
	healthy: number;

	@Field(() => Int)
	unhealthy: number;
}
