import {
	Args,
	ID,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { ConnectionArgs } from '../common/base/connection.args';
import { Auth, GQLUser } from '../common/decorators';
import { HelperService } from '../common/helper/helper.service';
import { Organisation } from '../organisation/organisation.entity';
import { User } from '../user/user.entity';
import { System, SystemConnection } from './system.entity';
import { SystemService } from './system.service';

@Resolver(() => System)
export class SystemResolver {
	constructor(
		private readonly systemService: SystemService,
		private readonly helperService: HelperService,
	) {}

	@ResolveField(() => Organisation)
	async organisation(@Parent() system: System) {
		return system.organisation.load();
	}

	@Auth()
	@Query(() => System)
	async system(
		@GQLUser() user: User,
		@Args({ name: 'id', type: () => ID }) id: string,
	) {
		return this.systemService.findByIDOrFail(id, user);
	}

	@Auth()
	@Query(() => SystemConnection)
	async systems(
		@GQLUser() user: User,
		@Args() { limit, page: _page }: ConnectionArgs<System>,
	) {
		const page = _page ?? 1;
		const offset = (page - 1) * limit;

		console.log(user.organisation.id);

		// Get results and number of results
		const [results, count] = await this.systemService.findByOrganisation(
			user.organisation.id,
			limit,
			offset,
		);

		const edges = results.map((result) => ({
			cursor: this.helperService.toBase64((result as any).id),
			node: result,
		}));

		return {
			edges,
			pageInfo: {
				total: count,
				hasNextPage: page < count / limit,
			},
		};
	}
}
