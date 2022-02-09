import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../../common/api.error';
import { Auth } from '../../common/decorators';
import { Service } from '../service.entity';
import { ServiceService } from '../service.service';
import { ServiceCreateInput } from './create.input';
import { InvalidProto } from './invalid-proto.exception';

@Resolver()
export class CreateResolver {
	constructor(private readonly serviceService: ServiceService) {}

	@Auth()
	@Mutation(() => Service)
	async serviceCreate(@Args('input') input: ServiceCreateInput) {
		const proto = await this.serviceService.loadProto(
			input.introspectionURL,
		);
		const namespace = this.serviceService.getNamespace(proto);
		if (!namespace) throw new InvalidProto('No namespace found');

		const valid = this.serviceService.validate(proto, namespace);
		if (!valid) throw new APIError(APIErrorCode.INVALID_SERVICE_DEFINITION);

		return this.serviceService.create({
			...input,
			namespace,
		});
	}
}
