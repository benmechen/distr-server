import { DeploymentCredentialsInput } from '../credentials.input';

export class UpdateDeploymentDTO {
	name?: string;

	credentials?: DeploymentCredentialsInput;
}
