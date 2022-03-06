import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorators';
import { System } from '../system.entity';
import { SystemService } from '../system.service';
import { SystemUpdateInput } from './update.input';

@Resolver()
export class UpdateResolver {
	constructor(private systemService: SystemService) {}

	@Auth()
	@Mutation(() => System)
	async systemUpdate(
		@Args({ name: 'id', type: () => ID }) id: string,
		@Args('input') input: SystemUpdateInput,
	) {
		const system = await this.systemService.findByIDOrFail(id);

		return this.systemService.update(system, input);
	}
}
