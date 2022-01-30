import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { SystemService } from '../system.service';
import { SystemUpdateInput } from './update.input';

@Resolver()
export class UpdateResolver {
	constructor(private systemService: SystemService) {}

	@Auth()
	@Mutation(() => System)
	async systemUpdate(
		@GQLUser() user: User,
		@Args({ name: 'id', type: () => ID }) id: string,
		@Args('input') input: SystemUpdateInput,
	) {
		const system = await this.systemService.findByIDOrFail(id);

		return this.systemService.update(system, input);
	}
}
