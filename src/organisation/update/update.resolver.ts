import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../../common/api.error';
import { GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { Organisation } from '../organisation.entity';
import { OrganisationService } from '../organisation.service';
import { OrganisationUpdateInput } from './update.input';

@Resolver()
export class UpdateResolver {
	constructor(private readonly organisationService: OrganisationService) {}

	@Mutation(() => Organisation)
	async organisationUpdate(
		@GQLUser() user: User,
		@Args({ name: 'id', type: () => ID }) id: string,
		@Args('input') input: OrganisationUpdateInput,
	) {
		const organisation = await this.organisationService.findByIDOrFail(id);
		const canEdit = await this.organisationService.isMember(
			user,
			organisation,
		);
		if (!canEdit)
			throw new APIError(APIErrorCode.UNAUTHORISED, 'organisation');

		return this.organisationService.update(organisation, input);
	}
}
