import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResolver } from '../common/base/base.resolver';
import { HelperService } from '../common/helper/helper.service';
import { Organisation } from '../organisation/organisation.entity';
import { UserRole } from '../user/user.entity';
import { CreateServiceDTO } from './create/create-service.dto';
import { ServiceCreateInput } from './create/create.input';
import { Field } from './field.type';
import { Service, ServiceConnection } from './service.entity';
import { ServiceService } from './service.service';
import { UpdateServiceDTO } from './update/update-service.dto';
import { ServiceUpdateInput } from './update/update.input';

@Resolver(() => Service)
export class ServiceResolver extends BaseResolver({
	entity: {
		single: Service,
		connection: ServiceConnection as any,
	},
	service: {
		create: CreateServiceDTO,
		update: UpdateServiceDTO,
	},
	resolver: {
		single: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		list: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		many: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		create: {
			ref: ServiceCreateInput,
			roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF],
		},
		update: {
			ref: ServiceUpdateInput,
			roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF],
		},
	},
}) {
	constructor(
		private readonly serviceService: ServiceService,
		helpersService: HelperService,
	) {
		super(serviceService, helpersService);
	}

	@ResolveField(() => [Field])
	async inputs(@Parent() parent: Service): Promise<Field[]> {
		const inputs = await this.serviceService.getInputs(parent);

		return inputs.map((input) => ({
			...input,
			// TS cannot type Object Values
			fields: input.fields
				? (Object.values(input.fields) as unknown as Field[])
				: undefined,
		}));
	}

	@ResolveField(() => Organisation)
	async author(@Parent() parent: Service) {
		return parent.author.load();
	}
}
