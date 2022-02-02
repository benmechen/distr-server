import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Deployment } from '../deployment.entity';
import { Resource } from './resource.entity';

@Resolver(() => Resource)
export class ResourceResolver {
	@ResolveField(() => Deployment)
	async deployment(@Parent() resource: Resource) {
		return resource.deployment.load();
	}
}
