import { Field, InputType } from '@nestjs/graphql';

@InputType({
	description:
		'This mutation is automatically generated and cannot be called.',
})
export class BaseInput {
	@Field({ description: 'Void', nullable: true })
	x: number;
}
