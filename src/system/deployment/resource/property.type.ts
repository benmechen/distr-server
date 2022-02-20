import { Field, ObjectType } from '@nestjs/graphql';
import { Property as IProperty } from '../../../generated/co/mechen/distr/common/v1';
import { Value } from './value.type';

@ObjectType()
export class Property implements IProperty {
	@Field({ description: 'Property name' })
	name: string;

	@Field(() => Value, { nullable: true })
	value: Value | undefined;
}
