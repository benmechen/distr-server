import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { SystemService } from '../system.service';
import { SystemCreateInput } from './create.input';

@Resolver()
export class CreateResolver {
	constructor(private readonly systemService: SystemService) {}

	@Auth()
	@Mutation(() => System)
	async systemCreate(
		@GQLUser() user: User,
		@Args('input') input: SystemCreateInput,
	) {
		return this.systemService.create({
			...input,
			organisation: user.organisation.unwrap(),
		});
	}
}
