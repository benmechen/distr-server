import { Field, InputType } from '@nestjs/graphql';
import { DeploymentCredentialsInput } from '../credentials.input';

@InputType()
export class DeploymentCreateInput {
	@Field({ description: 'Deployment name' })
	name: string;

	@Field(() => DeploymentCredentialsInput)
	credentials: DeploymentCredentialsInput;
}
