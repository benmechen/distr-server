import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { SystemService } from '../system.service';

@Resolver()
export class DeleteResolver {
	constructor(private systemService: SystemService) {}

	@Auth()
	@Mutation(() => Boolean)
	async systemDelete(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		const system = await this.systemService.findByIDByUser(id, user);

		try {
			await this.systemService.delete(system);
			return true;
		} catch (err) {
			return false;
		}
	}
}
