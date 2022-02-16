import { Field, Float, ID, InputType } from '@nestjs/graphql';
import JSON from 'graphql-type-json';
import {
	Input as InputField,
	Struct as StructField,
	Value as ValueField,
} from '../../../../generated/co/mechen/distr/common/v1';

@InputType()
export class Struct implements StructField {
	@Field(() => JSON)
	fields: { [key: string]: ValueField };
}

@InputType()
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

@InputType()
export class Input implements InputField {
	@Field({ description: 'Field name' })
	name: string;

	@Field(() => Value, { nullable: true })
	value: Value | undefined;
}

@InputType()
export class ResourceCreateInput {
	@Field({ description: 'Resource name' })
	name: string;

	@Field(() => ID, { description: 'ID of the service to create' })
	serviceID: string;

	@Field(() => [Input], { description: 'Inputs to pass to the service' })
	input: Input[];
}
