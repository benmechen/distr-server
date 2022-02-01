import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../common/decorators';
import { User } from '../../../user/user.entity';
import { DeploymentService } from '../deployment.service';

@Resolver()
export class DeleteResolver {
	constructor(private deploymentService: DeploymentService) {}

	@Auth()
	@Mutation(() => Boolean)
	async deploymentDelete(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		const deployment = await this.deploymentService.findByIDByUser(
			id,
			user,
		);

		try {
			await this.deploymentService.delete(deployment);
			return true;
		} catch (err) {
			return false;
		}
	}
}
