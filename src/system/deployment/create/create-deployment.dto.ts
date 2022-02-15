import { System } from '../../system.entity';
import { DeploymentCredentialsInput } from '../credentials.input';

export class CreateDeploymentDTO {
	name: string;

	system: System;

	credentials: DeploymentCredentialsInput;
}
