import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../../common/decorators';
import { User } from '../../../../user/user.entity';
import { Resource } from '../resource.entity';
import { ResourceService } from '../resource.service';
import { ResourceUpdateInput } from './update.input';

@Resolver()
export class UpdateResolver {
	constructor(private resourceService: ResourceService) {}

	@Auth()
	@Mutation(() => Resource)
	async resourceUpdate(
		@GQLUser() user: User,
		@Args({ name: 'id', type: () => ID }) id: string,
		@Args('input') input: ResourceUpdateInput,
	) {
		const resource = await this.resourceService.findByIDByUser(id, user);

		return this.resourceService.update(resource, input);
	}
}
