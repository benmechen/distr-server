import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import JSON from 'graphql-type-json';
import {
	Struct as StructField,
	Value as ValueField,
} from '../../../generated/co/mechen/distr/common/v1';

@InputType('StructInput')
@ObjectType()
export class Struct implements StructField {
	@Field(() => JSON)
	fields: { [key: string]: ValueField };
}

@InputType('ValueInput')
@ObjectType()
export class Value implements ValueField {
	@Field(() => Boolean, { nullable: true })
	boolValue: boolean | undefined;

	@Field(() => Float, { nullable: true })
	numberValue: number | undefined;

	@Field(() => String, { nullable: true })
	stringValue: string | undefined;

	@Field(() => Struct, { nullable: true })
	structValue: Struct | undefined;
}
