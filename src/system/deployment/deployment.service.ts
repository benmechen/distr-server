import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../../common/api.error';
import { BaseService } from '../../common/base/base.service';
import { HelperService } from '../../common/helper/helper.service';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { SystemService } from '../system.service';
import { CreateDeploymentDTO } from './create/create-system.dto';
import { Deployment } from './deployment.entity';
import { UpdateDeploymentDTO } from './update/update-system.dto';

@Injectable()
export class DeploymentService extends BaseService<
	Deployment,
	CreateDeploymentDTO,
	UpdateDeploymentDTO
> {
	constructor(
		@InjectRepository(Deployment)
		systemRepository: EntityRepository<Deployment>,
		helperService: HelperService,
		configService: ConfigService,
		private readonly systemService: SystemService,
	) {
		super(
			DeploymentService.name,
			systemRepository,
			helperService,
			configService,
		);
	}

	/**
	 * Find a deployment by its ID, throw an error if does not exist or user does not have access
	 * @param id ID of deployment
	 * @param user User to verify access (optional)
	 * @returns Deployment
	 */
	async findByIDByUser(id: string, user: User): Promise<Deployment> {
		const deployment = await super.findByIDOrFail(id, ['system']);

		if (user) {
			const hasAccess = await this.hasAccess(user, deployment);
			if (!hasAccess)
				throw new APIError(APIErrorCode.UNAUTHORISED, 'deployment');
		}

		return deployment;
	}

	/**
	 * Find all deployments in a system
	 * @param system System to query by
	 * @param limit Pagination limit (default `25`)
	 * @param skip Pagination skip
	 * @returns Paginated list and total
	 */
	async findBySystem(
		system: string | System,
		limit = 25,
		skip?: number,
	): Promise<[Deployment[], number]> {
		return this.repository.findAndCount(
			{
				system,
			},
			{
				limit,
				offset: skip,
			},
		);
	}

	/**
	 * Check if a user has access to a particular deployment's system
	 * @param user User
	 * @param deployment Deployment to check access
	 * @returns Access or not
	 */
	async hasAccess(user: User, deployment: Deployment): Promise<boolean> {
		const system = await deployment.system.load();
		return this.systemService.hasAccess(user, system);
	}
}
