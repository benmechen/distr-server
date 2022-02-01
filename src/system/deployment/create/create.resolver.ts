import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../common/decorators';
import { User } from '../../../user/user.entity';
import { SystemService } from '../../system.service';
import { Deployment } from '../deployment.entity';
import { DeploymentService } from '../deployment.service';
import { DeploymentCreateInput } from './create.input';

@Resolver()
export class CreateResolver {
	constructor(
		private readonly deploymentService: DeploymentService,
		private readonly systemService: SystemService,
	) {}

	@Auth()
	@Mutation(() => Deployment)
	async deploymentCreate(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'systemID' }) systemID: string,
		@Args('input') input: DeploymentCreateInput,
	) {
		const system = await this.systemService.findByIDByUser(systemID, user);

		return this.deploymentService.create({
			...input,
			system,
		});
	}
}
