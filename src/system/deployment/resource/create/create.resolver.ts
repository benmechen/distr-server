import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../../common/decorators';
import { ServiceService } from '../../../../service/service.service';
import { User } from '../../../../user/user.entity';
import { DeploymentService } from '../../deployment.service';
import { ResourceService } from '../resource.service';
import { ResourceCreateInput } from './create.input';
import { ResourceCreateResponse } from './create.response';

@Resolver()
export class CreateResolver {
	constructor(
		private readonly resourceService: ResourceService,
		private readonly deploymentService: DeploymentService,
		private readonly serviceService: ServiceService,
	) {}

	@Auth()
	@Mutation(() => ResourceCreateResponse)
	async resourceCreate(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'deploymentID' }) deploymentID: string,
		@Args('input') input: ResourceCreateInput,
	): Promise<ResourceCreateResponse> {
		const deployment = await this.deploymentService.findByIDByUser(
			deploymentID,
			user,
		);

		const service = await this.serviceService.findByIDOrFail(
			input.serviceID,
		);

		const { resource, properties } =
			await this.resourceService.createRemote({
				...input,
				deployment,
				service,
			});

		return {
			resource,
			details: properties,
		};
	}
}
