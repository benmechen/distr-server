import {
	Args,
	ID,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { Auth } from '../common/decorators';
import { Field } from './field.type';
import { Service } from './service.entity';
import { ServiceService } from './service.service';

@Resolver(() => Service)
export class ServiceResolver {
	constructor(private readonly serviceService: ServiceService) {}

	@Auth()
	@Query(() => Service)
	async service(@Args({ name: 'id', type: () => ID }) id: string) {
		return this.serviceService.findByIDOrFail(id);
	}

	@ResolveField(() => [Field])
	async inputs(@Parent() parent: Service): Promise<Field[]> {
		const inputs = await this.serviceService.getInputs(parent);

		return inputs.map((input) => ({
			...input,
			// TS cannot type Object Values
			fields: Object.values(input.fields) as unknown as Field[],
		}));
	}
}
