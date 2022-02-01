import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../common/decorators';
import { User } from '../../../user/user.entity';
import { Deployment } from '../deployment.entity';
import { DeploymentService } from '../deployment.service';
import { DeploymentUpdateInput } from './update.input';

@Resolver()
export class UpdateResolver {
	constructor(private deploymentService: DeploymentService) {}

	@Auth()
	@Mutation(() => Deployment)
	async deploymentUpdate(
		@GQLUser() user: User,
		@Args({ name: 'id', type: () => ID }) id: string,
		@Args('input') input: DeploymentUpdateInput,
	) {
		const deployment = await this.deploymentService.findByIDOrFail(id);

		return this.deploymentService.update(deployment, input);
	}
}
