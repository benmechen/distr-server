import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseService } from '../common/base/base.service';
import { HelperService } from '../common/helper/helper.service';
import { User } from '../user/user.entity';
import { CreateOrganisationDTO } from './dto/create-organisation.dto';
import { UpdateOrganisationDTO } from './dto/update-organisation.dto';
import { Organisation } from './organisation.entity';

@Injectable()
export class OrganisationService extends BaseService<
	Organisation,
	CreateOrganisationDTO,
	UpdateOrganisationDTO
> {
	constructor(
		@InjectRepository(Organisation)
		organisationRepository: EntityRepository<Organisation>,
		helperService: HelperService,
		configService: ConfigService,
	) {
		super(
			OrganisationService.name,
			organisationRepository,
			helperService,
			configService,
		);
	}

	/**
	 * Get all members of an organisation
	 * @param organisation
	 * @returns
	 */
	async getMembers(organisation: Organisation): Promise<User[]> {
		await organisation.members.init();
		return organisation.members.getItems();
	}

	/**
	 * Add a member to an organisation
	 * @param user User
	 * @param organisation Organisation to add to
	 * @returns Updated organisation
	 */
	async addMember(user: User, organisation: Organisation, flush = true) {
		organisation.members.add(user);
		if (flush) await this.repository.persistAndFlush(organisation);
		return organisation;
	}

	/**
	 * Remove member from an organisation
	 * @param user Member
	 * @param organisation Organisation to remove from
	 * @returns Updated organisation
	 */
	async removeMember(user: User, organisation: Organisation, flush = true) {
		await organisation.members.init();
		organisation.members.remove(user);
		if (flush) await this.repository.persistAndFlush(organisation);
		return organisation;
	}

	/**
	 * Check if a user is a member of an organisation
	 * @param user Member to check
	 * @param organisation Organisation
	 * @returns Member or not
	 */
	async isMember(user: User, organisation: Organisation): Promise<boolean> {
		const members = await organisation.members.init();
		return members.contains(user);
	}

	/**
	 * Create a default organisation for a user
	 * @param user User
	 * @returns Created organisation
	 */
	async createDefault(user: Pick<User, 'firstName'>): Promise<Organisation> {
		return super.create(
			{
				name: `${user.firstName}'s Organisation`,
			},
			false,
		);
	}
}
