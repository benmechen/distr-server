import { Field, ID, InputType } from '@nestjs/graphql';
import { Input } from '../input.type';

@InputType()
export class ResourceCreateInput {
	@Field({ description: 'Resource name' })
	name: string;

	@Field(() => ID, { description: 'ID of the service to create from' })
	serviceID: string;

	@Field(() => [Input], { description: 'Inputs to pass to the service' })
	input: Input[];
}
