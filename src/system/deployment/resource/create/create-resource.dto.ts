import { Service } from '../../../../service/service.entity';
import { Deployment } from '../../deployment.entity';
import { Input } from './create.input';

export class CreateResourceDTO {
	name: string;

	deployment: Deployment;

	service: Service;

	input: Input[];
}
