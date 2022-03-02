import { Field, InputType } from '@nestjs/graphql';
import { Input as InputField } from '../../../generated/co/mechen/distr/common/v1';
import { Value } from './value.type';

@InputType()
export class Input implements InputField {
	@Field({ description: 'Field name' })
	name: string;

	@Field(() => Value, { nullable: true })
	value: Value | undefined;
}
