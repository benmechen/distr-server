import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseService } from '../common/base/base.service';
import { HelperService } from '../common/helper/helper.service';
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
}
