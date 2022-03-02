import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../../common/decorators';
import { User } from '../../../../user/user.entity';
import { Input } from '../input.type';
import { Resource } from '../resource.entity';
import { ResourceService } from '../resource.service';

@Resolver()
export class DeleteResolver {
	constructor(private resourceService: ResourceService) {}

	@Auth()
	@Mutation(() => Resource)
	async resourceDelete(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
		@Args({ type: () => [Input], name: 'input', nullable: true })
		input?: Input[],
	) {
		const resource = await this.resourceService.findByIDByUser(id, user);

		return this.resourceService.delete(resource, true, input);
	}
}
