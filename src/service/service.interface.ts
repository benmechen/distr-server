import {
	CreateRequest,
	CreateResponse,
	ReflectMethodRequest,
	ReflectMethodResponse,
} from '../generated/co/mechen/distr/common/v1';

/**
 * Client for services
 * implementing `co.mechen.distr.common.v1`
 */
export interface ICommonService {
	reflect(input: ReflectMethodRequest): Promise<ReflectMethodResponse>;
	create(input: CreateRequest): Promise<CreateResponse>;
}
