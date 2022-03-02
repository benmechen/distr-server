import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import protobuf from 'protobufjs';
import * as grpc from '@grpc/grpc-js';
import * as protoloader from '@grpc/proto-loader';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuid } from 'uuid';
import * as os from 'os';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseService } from '../common/base/base.service';
import { HelperService } from '../common/helper/helper.service';
import { CreateServiceDTO } from './create/create-service.dto';
import { Service } from './service.entity';
import { UpdateServiceDTO } from './update/update-service.dto';
import { ServiceConnection } from './connection';
import { Credentials, Method } from '../generated/co/mechen/distr/common/v1';

@Injectable()
export class ServiceService extends BaseService<
	Service,
	CreateServiceDTO,
	UpdateServiceDTO
> {
	constructor(
		@InjectRepository(Service)
		private readonly serviceRepository: EntityRepository<Service>,
		helperService: HelperService,
		configService: ConfigService,
		private readonly httpService: HttpService,
	) {
		super(
			ServiceService.name,
			serviceRepository,
			helperService,
			configService,
		);
	}

	async findAllUnblocked() {
		return this.serviceRepository.find({
			blocked: false,
		});
	}

	async loadProto(
		url: string,
		returnType: 'json',
	): Promise<protobuf.INamespace>;

	async loadProto(
		url: string,
		returnType: 'grpc',
		service?: Service,
	): Promise<grpc.GrpcObject>;

	async loadProto(
		url: string,
		returnType: 'json' | 'grpc',
		service?: Service,
	) {
		const body = await this.httpService.get(url).toPromise();

		if (returnType === 'json') {
			const root = protobuf.parse(body.data);
			const json = root.root.toJSON();

			return json;
		}

		// TODO - Check if already loaded
		const tempFile = join(os.tmpdir(), `${service?.id ?? uuid()}.proto`);
		await writeFile(tempFile, body.data);

		const packageDefinition = await protoloader.load(tempFile, {
			includeDirs: [join(__dirname, '../../../protos')],
		});
		return grpc.loadPackageDefinition(packageDefinition);
	}

	/**
	 * Extract the namespace from a Protobuf JSON object
	 * @param proto JSON Proto object
	 * @returns Namespace, if found
	 */
	getNamespace(proto: protobuf.INamespace): string | undefined {
		if (!proto.nested) return undefined;

		const namespaces = Object.keys(proto.nested);
		return namespaces[0];
	}

	/**
	 * Check if a Proto object matches the specification for a service
	 * @param proto Proto JSON object
	 * @param namespace Namespace to validate
	 * @returns Correct or not
	 */
	validate(proto: protobuf.INamespace, namespace: string): boolean {
		if (!proto.nested) return false;
		const localised = proto.nested[namespace] as protobuf.IType;

		const mainService = localised.nested?.MainService as protobuf.IService;
		if (!mainService) return false;

		const reflect = this.validateMethod(
			mainService.methods.Reflect,
			'co.mechen.distr.common.v1.ReflectMethodRequest',
			'co.mechen.distr.common.v1.ReflectMethodResponse',
		);
		const get = this.validateMethod(
			mainService.methods.Get,
			'co.mechen.distr.common.v1.GetRequest',
			'co.mechen.distr.common.v1.GetResponse',
		);
		const status = this.validateMethod(
			mainService.methods.Status,
			'co.mechen.distr.common.v1.StatusRequest',
			'co.mechen.distr.common.v1.StatusResponse',
		);
		const create = this.validateMethod(
			mainService.methods.Create,
			'co.mechen.distr.common.v1.CreateRequest',
			'co.mechen.distr.common.v1.CreateResponse',
		);
		const update = this.validateMethod(
			mainService.methods.Update,
			'co.mechen.distr.common.v1.UpdateRequest',
			'co.mechen.distr.common.v1.UpdateResponse',
		);
		const deleteMethod = this.validateMethod(
			mainService.methods.Delete,
			'co.mechen.distr.common.v1.DeleteRequest',
			'co.mechen.distr.common.v1.DeleteResponse',
		);

		return (
			!!reflect &&
			!!get &&
			!status &&
			!!create &&
			!!update &&
			!!deleteMethod
		);
	}

	/**
	 * Connect to a service
	 * @param service Service
	 * @returns Service connection
	 */
	async connect(service: Service, credentials?: Credentials) {
		this.logger.debug('Connecting to service', { service });
		const clientDef = await this.loadProto(
			service.introspectionURL,
			'grpc',
		);
		const MainService = (clientDef[service.namespace] as grpc.GrpcObject)
			.MainService as grpc.ServiceClientConstructor;
		const connection = new ServiceConnection(
			MainService,
			service,
			credentials,
		);
		this.logger.info('Connected to service', { connection });
		return connection;
	}

	/**
	 * Mark a service as blocked
	 * @param service Service to block
	 * @returns Updated service
	 */
	async block(service: Service, flush = true) {
		return this.update(
			service,
			{
				blocked: true,
			},
			flush,
		);
	}

	async getInputs(service: Service) {
		const connection = await this.connect(service);
		const create = await connection.reflect({
			method: Method.CREATE,
		});
		return create.inputs;
	}

	private validateMethod(
		method?: protobuf.IMethod,
		input?: string,
		output?: string,
	): protobuf.IMethod | false {
		if (!method) return false;
		if (method.requestType !== input) return false;
		if (method.responseType !== output) return false;
		return method;
	}

	@Cron(CronExpression.EVERY_HOUR)
	async validateAllServices() {
		const services = await this.findAllUnblocked();
		await Promise.all(
			services.map(async (service) => {
				const proto = await this.loadProto(
					service.introspectionURL,
					'json',
				);
				const namespace = this.getNamespace(proto);
				// TODO: Invalid
				if (!namespace) return this.block(service);

				const valid = this.validate(proto, namespace);
				// TODO: Invalid
				if (!valid) return this.block(service);
				return true;
			}),
		);
	}
}
