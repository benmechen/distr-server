import { Deployment } from '../../deployment.entity';

export class CreateResourceDTO {
	name: string;

	deployment: Deployment;
}
