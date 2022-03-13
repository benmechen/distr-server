import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../../common/api.error';
import { Auth, GQLUser } from '../../common/decorators';
import { User, UserRole } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { Organisation } from '../organisation.entity';
import { OrganisationService } from '../organisation.service';
import { OrganisationMemberAddInput } from './add-member.input';

@Resolver()
export class AddMemberResolver {
	constructor(
		private readonly organisationService: OrganisationService,
		private readonly userService: UserService,
	) {}

	@Auth()
	@Mutation(() => Organisation)
	async organisationMemberAdd(
		@GQLUser() user: User,
		@Args({
			name: 'organisationID',
			type: () => ID,
		})
		organisationID: string,
		@Args('input')
		input: OrganisationMemberAddInput,
	) {
		const organisation = await this.organisationService.findByIDOrFail(
			organisationID,
		);
		const canAdd = await this.organisationService.isMember(
			user,
			organisation,
		);
		if (!canAdd)
			throw new APIError(APIErrorCode.UNAUTHORISED, 'organisation');

		const newUser = await this.userService.create({
			...input,
			role: UserRole.CUSTOMER,
			organisation,
		});

		return this.organisationService.addMember(newUser, organisation);
	}
}
