import { EntityRepository, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError, APIErrorCode } from '../../common/api.error';
import { BaseService } from '../../common/base/base.service';
import { CipherService } from '../../common/cipher/cipher.service';
import { HelperService } from '../../common/helper/helper.service';
import { Credentials } from '../../generated/co/mechen/distr/common/v1';
import { User } from '../../user/user.entity';
import { System } from '../system.entity';
import { SystemService } from '../system.service';
import { CreateDeploymentDTO } from './create/create-deployment.dto';
import {
	AWSCredentials,
	AzureCredentials,
	OtherCredentials,
} from './credentials.input';
import { Deployment } from './deployment.entity';
import { UpdateDeploymentDTO } from './update/update-deployment.dto';

@Injectable()
export class DeploymentService extends BaseService<
	Deployment,
	CreateDeploymentDTO,
	UpdateDeploymentDTO
> {
	constructor(
		@InjectRepository(Deployment)
		private readonly deploymentRepository: EntityRepository<Deployment>,
		helperService: HelperService,
		configService: ConfigService,
		private readonly systemService: SystemService,
		private readonly cipherService: CipherService,
	) {
		super(
			DeploymentService.name,
			deploymentRepository,
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

	/**
	 * Create a new deployment
	 * @desciption Encrypts credentials before saving
	 * @param input Deployment details
	 * @param flush Persist immediately?
	 * @returns Created deployment
	 */
	async create(
		{ credentials, ...input }: CreateDeploymentDTO,
		flush = true,
	): Promise<Deployment> {
		this.logger.info('create', { input });
		let awsCredentials: AWSCredentials | undefined;
		let azureCredentials: AzureCredentials | undefined;
		let otherCredentials: OtherCredentials | undefined;
		if (credentials.aws) {
			awsCredentials = {
				...credentials.aws,
				secret: this.cipherService.encrypt(credentials.aws.secret),
			};
		}
		if (credentials.azure) {
			azureCredentials = {
				...credentials.azure,
				secret: this.cipherService.encrypt(credentials.azure.secret),
			};
		}
		if (credentials.other) {
			otherCredentials = { values: {} };
			Object.entries(credentials.other.values).map(
				async ([key, value]) => {
					otherCredentials!.values[key] = this.cipherService.encrypt(
						value as string,
					);
				},
			);
		}

		const entity = this.deploymentRepository.create({
			...input,
			awsCredentials,
			azureCredentials,
			otherCredentials,
		});
		wrap(entity);

		if (flush) await this.deploymentRepository.persistAndFlush(entity);
		else this.deploymentRepository.persist(entity);

		return entity;
	}

	/**
	 * Get and decrypt service credentials for a deployment
	 * @param deployment Deployment
	 * @returns Decrypted credentials
	 */
	getCredentials(deployment: Deployment): Credentials {
		let aws: AWSCredentials | undefined;
		let azure: AzureCredentials | undefined;
		let other: OtherCredentials | undefined;
		if (deployment.awsCredentials)
			aws = {
				id: deployment.awsCredentials.id,
				secret: this.cipherService.decrypt(
					deployment.awsCredentials.secret,
				),
				region: deployment.awsCredentials.region,
			};
		if (deployment.azureCredentials)
			azure = {
				tenantId: deployment.azureCredentials.tenantId,
				clientId: deployment.azureCredentials.clientId,
				secret: this.cipherService.decrypt(
					deployment.azureCredentials.secret,
				),
			};
		if (deployment.otherCredentials) {
			other = { values: {} };
			Object.entries(deployment.otherCredentials.values).map(
				async ([key, value]) => {
					other!.values[key] = this.cipherService.decrypt(value);
				},
			);
		}

		return {
			aws,
			azure,
			other,
		};
	}
}
