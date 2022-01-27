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
}
