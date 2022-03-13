import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { Organisation } from './organisation.entity';
import { OrganisationService } from './organisation.service';

@Resolver(() => Organisation)
export class OrganisationResolver {
	constructor(private readonly organisationService: OrganisationService) {}

	@ResolveField(() => [User])
	async members(@Parent() organisation: Organisation) {
		return this.organisationService.getMembers(organisation);
	}
}
