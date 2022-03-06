import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../../../common/api.error';
import { BaseService } from '../../../common/base/base.service';
import { HelperService } from '../../../common/helper/helper.service';
import { Input } from '../../../generated/co/mechen/distr/common/v1';
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
		@Inject(forwardRef(() => DeploymentService))
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
	 * Get a resource's status from its service
	 * @param resource Resource
	 * @returns Status
	 */
	async getStatus(resource: Resource) {
		const deployment = await resource.deployment.load();
		const service = await resource.service.load();
		const credentials = this.deploymentService.getCredentials(deployment);
		const connection = await this.serviceService.connect(
			service,
			credentials,
		);
		return connection.status(resource);
	}

	/**
	 * Get usage from the resource's service
	 * @param resource Resource
	 * @returns Usage statistics
	 */
	async getUsage(resource: Resource) {
		const deployment = await resource.deployment.load();
		const service = await resource.service.load();
		const credentials = this.deploymentService.getCredentials(deployment);
		const connection = await this.serviceService.connect(
			service,
			credentials,
		);
		return connection.usage(resource);
	}

	/**
	 * Get any details from the service about the resource
	 * @param resource Resource
	 * @returns Properties
	 */
	async getDetails(resource: Resource) {
		const deployment = await resource.deployment.load();
		const service = await resource.service.load();
		const credentials = this.deploymentService.getCredentials(deployment);
		const connection = await this.serviceService.connect(
			service,
			credentials,
		);
		return connection.get(resource);
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
		const credentials = this.deploymentService.getCredentials(
			input.deployment,
		);
		const connection = await this.serviceService.connect(
			input.service,
			credentials,
		);
		await connection.create(resource, {
			payload: input.input,
		});
		return resource;
	}

	async update(
		resource: Resource,
		input: UpdateResourceDTO,
		flush?: boolean,
	): Promise<Resource> {
		if (input.input) {
			const deployment = await resource.deployment.load();
			const service = await resource.service.load();
			const credentials =
				this.deploymentService.getCredentials(deployment);
			const connection = await this.serviceService.connect(
				service,
				credentials,
			);
			await connection.update(resource, {
				payload: input.input,
			});
		}

		return super.update(resource, input, flush);
	}

	async delete(
		entity: string,
		flush?: boolean,
		input?: Input[],
	): Promise<Resource | null>;

	async delete(
		entity: Resource,
		flush?: boolean,
		input?: Input[],
	): Promise<Resource | null>;

	async delete(
		entity: string | Resource,
		flush?: boolean,
		input?: Input[],
	): Promise<Resource | null> {
		let resource: Resource;
		if (typeof entity === 'string')
			resource = await this.findByIDOrFail(entity);
		else resource = entity;

		const deployment = await resource.deployment.load();
		const service = await resource.service.load();
		const credentials = this.deploymentService.getCredentials(deployment);
		const connection = await this.serviceService.connect(
			service,
			credentials,
		);
		try {
			await connection.delete(resource, {
				payload: input,
			});
		} catch (error) {
			this.logger.warn('Failed to delete remote resource', { error });
		}

		this.repository.remove(resource);
		if (flush) await this.repository.flush();

		return resource;
	}
}
