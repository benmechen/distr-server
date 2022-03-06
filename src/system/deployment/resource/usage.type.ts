import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UsageType } from '../../../generated/co/mechen/distr/common/v1';

registerEnumType(UsageType, {
	name: 'UsageType',
	description: 'Usage type',
});

@ObjectType()
export class Usage {
	@Field(() => UsageType)
	type: UsageType;

	@Field({ nullable: true })
	current?: number;

	@Field({ nullable: true })
	limit?: number;
}
