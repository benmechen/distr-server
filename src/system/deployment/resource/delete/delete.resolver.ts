import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../../common/decorators';
import { User } from '../../../../user/user.entity';
import { ResourceService } from '../resource.service';

@Resolver()
export class DeleteResolver {
	constructor(private resourceService: ResourceService) {}

	@Auth()
	@Mutation(() => Boolean)
	async resourceDelete(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		const resource = await this.resourceService.findByIDByUser(id, user);

		try {
			await this.resourceService.delete(resource);
			return true;
		} catch (err) {
			return false;
		}
	}
}
