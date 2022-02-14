import { Field, ID, InputType } from '@nestjs/graphql';
import JSON from 'graphql-type-json';

@InputType()
export class ResourceCreateInput {
	@Field({ description: 'Resource name' })
	name: string;

	@Field(() => ID, { description: 'ID of the service to create' })
	serviceID: string;

	@Field(() => JSON, { description: 'Input to pass to the service' })
	input: Record<string, any>;
}
