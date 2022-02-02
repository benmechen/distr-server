import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ResourceCreateInput {
	@Field({ description: 'Resource name' })
	name: string;
}
