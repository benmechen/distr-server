import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../common/api.error';
import { BaseService } from '../common/base/base.service';
import { HelperService } from '../common/helper/helper.service';
import { Organisation } from '../organisation/organisation.entity';
import { OrganisationService } from '../organisation/organisation.service';
import { User } from '../user/user.entity';
import { CreateSystemDTO } from './create/create-system.dto';
import { System } from './system.entity';
import { UpdateSystemDTO } from './update/update-system.dto';

@Injectable()
export class SystemService extends BaseService<
	System,
	CreateSystemDTO,
	UpdateSystemDTO
> {
	constructor(
		@InjectRepository(System)
		systemRepository: EntityRepository<System>,
		helperService: HelperService,
		configService: ConfigService,
		private readonly organisationService: OrganisationService,
	) {
		super(
			SystemService.name,
			systemRepository,
			helperService,
			configService,
		);
	}

	/**
	 * Find a system by it's ID, throw an error if does not exist or user does not have access
	 * @param id ID of system
	 * @param user User to verify access (optional)
	 * @returns System
	 */
	async findByIDOrFail(id: string, user?: User): Promise<System> {
		const system = await super.findByIDOrFail(id);

		if (user) {
			const hasAccess = await this.hasAccess(user, system);
			if (!hasAccess)
				throw new APIError(APIErrorCode.UNAUTHORISED, 'system');
		}

		return system;
	}

	/**
	 * Find all systems for an organisation
	 * @param organisation Organisation to query by
	 * @param limit Pagination limit (default `25`)
	 * @param skip Pagination skip
	 * @returns Paginated list and total
	 */
	async findByOrganisation(
		organisation: string | Organisation,
		limit = 25,
		skip?: number,
	): Promise<[System[], number]> {
		return this.repository.findAndCount(
			{
				organisation,
			},
			{
				limit,
				offset: skip,
			},
		);
	}

	/**
	 * Check if a user has access to a particular system's organisation
	 * @param user User
	 * @param system System to check access
	 * @returns Access or not
	 */
	async hasAccess(user: User, system: System): Promise<boolean> {
		const organisation = await system.organisation.load();
		return this.organisationService.isMember(user, organisation);
	}
}