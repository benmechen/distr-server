import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorators';
import { UserService } from '../../user/user.service';
import { Organisation } from '../organisation.entity';
import { OrganisationService } from '../organisation.service';

@Resolver()
export class RemoveMemberResolver {
	constructor(
		private readonly organisationService: OrganisationService,
		private readonly userService: UserService,
	) {}

	@Auth()
	@Mutation(() => Organisation)
	async organisationMemberRemove(
		@Args({ name: 'organisationID', type: () => ID })
		organisationID: string,
		@Args({
			name: 'memberID',
			type: () => ID,
		})
		memberID: string,
	) {
		const organisation = await this.organisationService.findByIDOrFail(
			organisationID,
		);
		const user = await this.userService.findByIDOrFail(memberID);

		const newOrganisation = await this.organisationService.createDefault(
			user,
		);

		await this.userService.update(user, {
			organisation: newOrganisation,
		});

		return organisation;
	}
}
