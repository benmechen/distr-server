import {
	ObjectType,
	Field as GQLField,
	registerEnumType,
} from '@nestjs/graphql';
import {
	Field as IField,
	Field_Type as FieldType,
} from '../generated/co/mechen/distr/common/v1';
import { Value } from '../system/deployment/resource/value.type';

registerEnumType(FieldType, {
	name: 'FieldType',
});

@ObjectType()
export class Field implements Omit<IField, 'fields'> {
	@GQLField()
	name: string;

	@GQLField(() => String, { nullable: true })
	description?: string | undefined;

	@GQLField(() => Value, { nullable: true })
	defaultValue?: Value | undefined;

	@GQLField()
	required: boolean;

	@GQLField(() => [Field], { nullable: true })
	fields?: Field[];

	@GQLField(() => FieldType)
	type: FieldType;
}
