import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../../../common/api.error';
import { BaseService } from '../../../common/base/base.service';
import { HelperService } from '../../../common/helper/helper.service';
import { ServiceService } from '../../../service/service.service';
import { User } from '../../../user/user.entity';
import { Deployment } from '../deployment.entity';
import { DeploymentService } from '../deployment.service';
import { CreateResourceDTO } from './create/create-resource.dto';
import { Resource } from './resource.entity';
import { UpdateResourceDTO } from './update/update-resource.dto';

@Injectable()
export class ResourceService extends BaseService<
	Resource,
	CreateResourceDTO,
	UpdateResourceDTO
> {
	constructor(
		@InjectRepository(Resource)
		systemRepository: EntityRepository<Resource>,
		helperService: HelperService,
		configService: ConfigService,
		private readonly deploymentService: DeploymentService,
		private readonly serviceService: ServiceService,
	) {
		super(
			ResourceService.name,
			systemRepository,
			helperService,
			configService,
		);
	}

	/**
	 * Find a resource by its ID, throw an error if does not exist or user does not have access
	 * @param id ID of resource
	 * @param user User to verify access (optional)
	 * @returns Resource
	 */
	async findByIDByUser(id: string, user: User): Promise<Resource> {
		const resource = await super.findByIDOrFail(id, ['deployment']);

		if (user) {
			const hasAccess = await this.hasAccess(user, resource);
			if (!hasAccess)
				throw new APIError(APIErrorCode.UNAUTHORISED, 'resource');
		}

		return resource;
	}

	/**
	 * Find all resources in a deployment
	 * @param deployment Deployment to query by
	 * @param limit Pagination limit (default `25`)
	 * @param skip Pagination skip
	 * @returns Paginated list and total
	 */
	async findByDeployment(
		deployment: string | Deployment,
		limit = 25,
		skip?: number,
	): Promise<[Resource[], number]> {
		return this.repository.findAndCount(
			{
				deployment,
			},
			{
				limit,
				offset: skip,
			},
		);
	}

	/**
	 * Check if a user has access to a particular resource's deployment
	 * @param user User
	 * @param resource Resource to check access
	 * @returns Access or not
	 */
	async hasAccess(user: User, resource: Resource): Promise<boolean> {
		const system = await resource.deployment.load();
		return this.deploymentService.hasAccess(user, system);
	}

	async create(input: CreateResourceDTO, flush?: boolean): Promise<Resource> {
		const resource = await super.create(input, flush);
		await this.serviceService.connect(input.service);
		return resource;
	}
}
