import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../../common/api.error';
import { Auth, GQLUser } from '../../common/decorators';
import { User } from '../../user/user.entity';
import { Service } from '../service.entity';
import { ServiceService } from '../service.service';
import { ServiceCreateInput } from './create.input';
import { InvalidProto } from './invalid-proto.exception';

@Resolver()
export class CreateResolver {
	constructor(private readonly serviceService: ServiceService) {}

	@Auth()
	@Mutation(() => Service, { name: 'serviceCreate' })
	async serviceCreate(
		@GQLUser() user: User,
		@Args('input') input: ServiceCreateInput,
	) {
		const proto = await this.serviceService.loadProto(
			input.introspectionURL,
			'json',
		);
		const namespace = this.serviceService.getNamespace(proto);
		if (!namespace) throw new InvalidProto('No namespace found');

		const valid = this.serviceService.validate(proto, namespace);
		if (!valid) throw new APIError(APIErrorCode.INVALID_SERVICE_DEFINITION);

		const author = await user.organisation.load();

		return this.serviceService.create({
			...input,
			namespace,
			author,
		});
	}
}
