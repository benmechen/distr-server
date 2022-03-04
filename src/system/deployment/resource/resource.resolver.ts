import {
	Args,
	ID,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { Auth, GQLUser } from '../../../common/decorators';
import { Status } from '../../../generated/co/mechen/distr/common/v1';
import { Service } from '../../../service/service.entity';
import { User } from '../../../user/user.entity';
import { Deployment } from '../deployment.entity';
import { Property } from './property.type';
import { Resource } from './resource.entity';
import { ResourceService } from './resource.service';
import { Limit, Usage } from './usage.type';

@Resolver(() => Resource)
export class ResourceResolver {
	constructor(private readonly resourceService: ResourceService) {}

	@ResolveField(() => Deployment)
	async deployment(@Parent() resource: Resource) {
		return resource.deployment.load();
	}

	@ResolveField(() => Service)
	async service(@Parent() resource: Resource) {
		return resource.service.load();
	}

	@ResolveField(() => Status)
	async status(@Parent() resource: Resource): Promise<Status> {
		try {
			const status = await this.resourceService.getStatus(resource);
			return status.status;
		} catch (err) {
			return Status.DOWN;
		}
	}

	@ResolveField(() => Usage)
	async usage(): Promise<Usage> {
		return {
			type: Limit.LIMITED,
			limit: 100,
			current: Math.random() * 100,
		};
	}

	@ResolveField(() => [Property])
	async details(@Parent() resource: Resource): Promise<Property[]> {
		try {
			const details = await this.resourceService.getDetails(resource);
			return details.properties;
		} catch (err) {
			return [];
		}
	}

	// Queries
	@Auth()
	@Query(() => Resource)
	async resource(
		@GQLUser() user: User,
		@Args({ type: () => ID, name: 'id' }) id: string,
	) {
		return this.resourceService.findByIDByUser(id, user);
	}
}
