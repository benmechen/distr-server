import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SystemCreateInput {
	@Field({ description: 'System name' })
	name: string;
}
