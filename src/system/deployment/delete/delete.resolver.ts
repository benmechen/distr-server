import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../common/decorators';
import { User } from '../../../user/user.entity';
import { Deployment } from '../deployment.entity';
import { DeploymentService } from '../deployment.service';

@Resolver()
export class DeleteResolver {
	constructor(private deploymentService: DeploymentService) {}

	@Auth()
	@Mutation(() => Deployment)
	async deploymentDelete(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		const deployment = await this.deploymentService.findByIDByUser(
			id,
			user,
		);

		await this.deploymentService.delete(deployment, true);
		return deployment;
	}
}
