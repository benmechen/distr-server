import * as grpc from '@grpc/grpc-js';
import {
	CreateRequest,
	CreateResponse,
	Credentials,
	ReflectMethodRequest,
	ReflectMethodResponse,
} from '../generated/co/mechen/distr/common/v1';
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

	async create(
		input: Omit<CreateRequest, 'credentials'>,
	): Promise<CreateResponse> {
		const create = this.method<CreateRequest, CreateResponse>('create');
		return create({
			...input,
			credentials: this.credentials,
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
