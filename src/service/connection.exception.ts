import { status as GrpcStatus } from '@grpc/grpc-js';
import { ApolloError } from 'apollo-server-express';

export class ConnectionException extends ApolloError {
	constructor(code: GrpcStatus, message: string) {
		let _code: string;
		switch (code) {
			case GrpcStatus.ABORTED:
				_code = 'ABORTED';
				break;
			case GrpcStatus.ALREADY_EXISTS:
				_code = 'ALREADY_EXISTS';
				break;
			case GrpcStatus.CANCELLED:
				_code = 'CANCELLED';
				break;
			case GrpcStatus.DATA_LOSS:
				_code = 'DATA_LOSS';
				break;
			case GrpcStatus.DEADLINE_EXCEEDED:
				_code = 'DEADLINE_EXCEEDED';
				break;
			case GrpcStatus.FAILED_PRECONDITION:
				_code = 'FAILED_PRECONDITION';
				break;
			case GrpcStatus.INTERNAL:
				_code = 'INTERNAL';
				break;
			case GrpcStatus.INVALID_ARGUMENT:
				_code = 'INVALID_ARGUMENT';
				break;
			case GrpcStatus.NOT_FOUND:
				_code = 'NOT_FOUND';
				break;
			case GrpcStatus.OK:
				_code = 'OK';
				break;
			case GrpcStatus.OUT_OF_RANGE:
				_code = 'OUT_OF_RANGE';
				break;
			case GrpcStatus.PERMISSION_DENIED:
				_code = 'PERMISSION_DENIED';
				break;
			case GrpcStatus.RESOURCE_EXHAUSTED:
				_code = 'RESOURCE_EXHAUSTED';
				break;
			case GrpcStatus.UNAUTHENTICATED:
				_code = 'UNAUTHENTICATED';
				break;
			case GrpcStatus.UNAVAILABLE:
				_code = 'UNAVAILABLE';
				break;
			case GrpcStatus.UNIMPLEMENTED:
				_code = 'UNIMPLEMENTED';
				break;
			default:
				_code = 'UNKNOWN';
		}

		super(message, _code);
	}
}
