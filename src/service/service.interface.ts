import {
	CreateRequest,
	CreateResponse,
	DeleteRequest,
	DeleteResponse,
	GetResponse,
	ReflectMethodRequest,
	ReflectMethodResponse,
	StatusResponse,
	UpdateRequest,
	UpdateResponse,
} from '../generated/co/mechen/distr/common/v1';
import { Resource } from '../system/deployment/resource/resource.entity';

/**
 * Client for services
 * implementing `co.mechen.distr.common.v1`
 */
export interface ICommonService {
	reflect(input: ReflectMethodRequest): Promise<ReflectMethodResponse>;
	get(resource: Resource): Promise<GetResponse>;
	status(resource: Resource): Promise<StatusResponse>;
	create(resource: Resource, input: CreateRequest): Promise<CreateResponse>;
	update(resource: Resource, input: UpdateRequest): Promise<UpdateResponse>;
	delete(resource: Resource, input: DeleteRequest): Promise<DeleteResponse>;
}
