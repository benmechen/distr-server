import { Service } from '../../../../service/service.entity';
import { Deployment } from '../../deployment.entity';
import { Input } from '../input.type';

export class CreateResourceDTO {
	id?: string;

	name: string;

	deployment: Deployment;

	service: Service;

	input: Input[];
}
