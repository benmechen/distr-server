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
import { User } from '../../../user/user.entity';
import { Deployment } from '../deployment.entity';
import { Property } from './property.type';
import { Resource } from './resource.entity';
import { ResourceService } from './resource.service';

@Resolver(() => Resource)
export class ResourceResolver {
	constructor(private readonly resourceService: ResourceService) {}

	@ResolveField(() => Deployment)
	async deployment(@Parent() resource: Resource) {
		return resource.deployment.load();
	}

	@ResolveField(() => Status)
	async status(@Parent() resource: Resource): Promise<Status> {
		const status = await this.resourceService.getStatus(resource);
		return status.status;
	}

	@ResolveField(() => [Property])
	async details(@Parent() resource: Resource): Promise<Property[]> {
		const details = await this.resourceService.getDetails(resource);
		return details.properties;
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
