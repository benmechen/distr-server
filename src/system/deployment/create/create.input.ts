import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeploymentCreateInput {
	@Field({ description: 'Deployment name' })
	name: string;
}
