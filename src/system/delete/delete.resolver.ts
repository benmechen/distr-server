import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { SystemService } from '../system.service';

@Resolver()
export class DeleteResolver {
	constructor(private systemService: SystemService) {}

	@Auth()
	@Mutation(() => System)
	async systemDelete(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		const system = await this.systemService.findByIDByUser(id, user);

		return this.systemService.delete(system, true);
	}
}
