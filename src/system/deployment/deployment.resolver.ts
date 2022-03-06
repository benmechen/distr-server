import {
	Args,
	ID,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { Auth, GQLUser } from '../../common/decorators';
import { StatusOverview } from '../../common/status-overview.type';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { Deployment } from './deployment.entity';
import { DeploymentService } from './deployment.service';
import { Resource } from './resource/resource.entity';
import { ResourceService } from './resource/resource.service';

@Resolver(() => Deployment)
export class DeploymentResolver {
	constructor(
		private readonly deploymentService: DeploymentService,
		private readonly resourceService: ResourceService,
	) {}

	@ResolveField(() => System)
	async system(@Parent() deployment: Deployment) {
		return deployment.system.load();
	}

	@ResolveField(() => [Resource])
	async resources(@Parent() deployment: Deployment) {
		const [resources] = await this.resourceService.findByDeployment(
			deployment,
		);
		return resources;
	}

	@ResolveField(() => StatusOverview)
	async status(@Parent() deployment: Deployment): Promise<StatusOverview> {
		return this.deploymentService.getStatus(deployment);
	}

	@Auth()
	@Query(() => Deployment)
	async deployment(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		return this.deploymentService.findByIDByUser(id, user);
	}
}
