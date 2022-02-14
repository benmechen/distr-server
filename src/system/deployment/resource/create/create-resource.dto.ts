import { Service } from '../../../../service/service.entity';
import { Deployment } from '../../deployment.entity';

export class CreateResourceDTO {
	name: string;

	deployment: Deployment;

	service: Service;
}