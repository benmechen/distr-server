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
import { BaseService } from '../common/base/base.service';
import { HelperService } from '../common/helper/helper.service';
import { CreateServiceDTO } from './create/create-service.dto';
import { Service } from './service.entity';
import { UpdateServiceDTO } from './update/update-service.dto';

@Injectable()
export class ServiceService extends BaseService<
	Service,
	CreateServiceDTO,
	UpdateServiceDTO
> {
	constructor(
		@InjectRepository(Service)
		serviceRepository: EntityRepository<Service>,
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

		const reflect = mainService.methods.Reflect;
		if (!reflect) return false;
		if (
			reflect.requestType !==
			'co.mechen.distr.common.v1.ReflectMethodRequest'
		)
			return false;
		if (
			reflect.responseType !==
			'co.mechen.distr.common.v1.ReflectMethodResponse'
		)
			return false;

		return true;
	}

	async connect(service: Service) {
		const clientDef = await this.loadProto(
			service.introspectionURL,
			'grpc',
		);
		const MainService = (clientDef[service.namespace] as grpc.GrpcObject)
			.MainService as grpc.ServiceClientConstructor;
		const client = new MainService(
			service.serviceURL,
			grpc.credentials.createInsecure(),
		);
		console.log(client);
		client.reflect({}, (error: any, data: any) => {
			console.log(error);
			console.log(data);
		});
	}
}
