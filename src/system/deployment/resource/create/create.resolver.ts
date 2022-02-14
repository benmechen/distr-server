import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../../common/decorators';
import { ServiceService } from '../../../../service/service.service';
import { User } from '../../../../user/user.entity';
import { DeploymentService } from '../../deployment.service';
import { Resource } from '../resource.entity';
import { ResourceService } from '../resource.service';
import { ResourceCreateInput } from './create.input';

@Resolver()
export class CreateResolver {
	constructor(
		private readonly resourceService: ResourceService,
		private readonly deploymentService: DeploymentService,
		private readonly serviceService: ServiceService,
	) {}

	@Auth()
	@Mutation(() => Resource)
	async resourceCreate(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'deploymentID' }) deploymentID: string,
		@Args('input') input: ResourceCreateInput,
	) {
		const deployment = await this.deploymentService.findByIDByUser(
			deploymentID,
			user,
		);

		const service = await this.serviceService.findByIDOrFail(
			input.serviceID,
		);

		return this.resourceService.create({
			...input,
			deployment,
			service,
		});
	}
}
