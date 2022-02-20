import * as grpc from '@grpc/grpc-js';
import {
	CreateRequest,
	CreateResponse,
	Credentials,
	DeleteRequest,
	DeleteResponse,
	GetRequest,
	GetResponse,
	ReflectMethodRequest,
	ReflectMethodResponse,
	StatusRequest,
	StatusResponse,
	UpdateRequest,
	UpdateResponse,
} from '../generated/co/mechen/distr/common/v1';
import { Resource } from '../system/deployment/resource/resource.entity';
import { Service } from './service.entity';
import { ICommonService } from './service.interface';

/* eslint-disable @typescript-eslint/ban-types */
export interface Client extends grpc.Client {
	[methodName: string]: Function;
}
/* eslint-enable @typescript-eslint/ban-types */

export class ServiceConnection implements ICommonService {
	private client: Client;

	constructor(
		From: grpc.ServiceClientConstructor,
		service: Service,
		private readonly credentials: Credentials,
	) {
		this.client = new From(
			service.serviceURL,
			grpc.credentials.createInsecure(),
		);
	}

	async reflect(input: ReflectMethodRequest): Promise<ReflectMethodResponse> {
		const reflect = this.method<
			ReflectMethodRequest,
			ReflectMethodResponse
		>('reflect');
		return reflect(input);
	}

	async get(resource: Resource): Promise<GetResponse> {
		const get = this.method<GetRequest, GetResponse>('get');
		return get({
			credentials: this.credentials,
			resourceId: resource.id,
		});
	}

	async status(resource: Resource): Promise<StatusResponse> {
		const status = this.method<StatusRequest, StatusResponse>('status');
		return status({
			credentials: this.credentials,
			resourceId: resource.id,
		});
	}

	async create(
		resource: Resource,
		input: Omit<CreateRequest, 'credentials' | 'resourceId'>,
	): Promise<CreateResponse> {
		const create = this.method<CreateRequest, CreateResponse>('create');
		return create({
			...input,
			credentials: this.credentials,
			resourceId: resource.id,
		});
	}

	async update(
		resource: Resource,
		input: Omit<UpdateRequest, 'credentials' | 'resourceId'>,
	): Promise<UpdateResponse> {
		const update = this.method<UpdateRequest, UpdateResponse>('update');
		return update({
			...input,
			credentials: this.credentials,
			resourceId: resource.id,
		});
	}

	async delete(
		resource: Resource,
		input?: Partial<Omit<DeleteRequest, 'credentials' | 'resourceId'>>,
	): Promise<DeleteResponse> {
		const deleteMethod = this.method<DeleteRequest, DeleteResponse>(
			'delete',
		);
		return deleteMethod({
			credentials: this.credentials,
			resourceId: resource.id,
			payload: input?.payload ?? [],
		});
	}

	private method<I, O>(name: string): (input: I) => Promise<O> {
		return (input: I) => {
			return new Promise((resolve, reject) => {
				this.client[name](input, (error: Error, data: O) => {
					if (error) return reject(error);
					return resolve(data);
				});
			});
		};
	}
}
