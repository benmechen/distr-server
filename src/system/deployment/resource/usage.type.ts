import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum Limit {
	LIMITED = 'LIMITED',
	UNLIMITED = 'UNLIMITED',
}
registerEnumType(Limit, {
	name: 'Limit',
});

@ObjectType()
export class Usage {
	@Field(() => Limit)
	type: Limit;

	@Field({ nullable: true })
	current?: number;

	@Field({ nullable: true })
	limit?: number;
}
