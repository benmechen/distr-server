import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ServiceUpdateInput {
	@Field({ nullable: true, description: 'Public name of the service' })
	name?: string;

	@Field({ nullable: true })
	description?: string;

	// @IsUrl()
	@Field({ nullable: true, description: 'URL of service' })
	serviceURL?: string;

	// @IsUrl()
	@Field({
		nullable: true,
		description: 'URL of proto introspection location',
	})
	introspectionURL?: string;
}
