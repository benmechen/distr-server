import {
	Args,
	ID,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { Auth, GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { Deployment } from './deployment.entity';
import { DeploymentService } from './deployment.service';

@Resolver(() => Deployment)
export class DeploymentResolver {
	constructor(private readonly deploymentService: DeploymentService) {}

	@ResolveField(() => System)
	async system(@Parent() deployment: Deployment) {
		return deployment.system.load();
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
