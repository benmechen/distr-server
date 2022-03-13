import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OrganisationUpdateInput {
	@Field({ nullable: true })
	name?: string;
}
