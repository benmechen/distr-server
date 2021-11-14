import { Type } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { APIError, APIErrorCode } from '../api.error';
import { UserRole } from '../../user/user.entity';
import { Auth } from '../decorators';
import { HelperService } from '../helper/helper.service';
import { IBaseService } from './base.service';
import { ConnectionArgs } from './connection.args';
import { Paginated } from './paginated.entity';

type ResolverRoles = UserRole[] | null;
// {
// 	single?: UserRole[] | null;
// 	list?: UserRole[] | null;
// 	many?: UserRole[] | null;
// 	create?: UserRole[] | null;
// 	update?: UserRole[] | null;
// 	delete?: UserRole[] | null;
// 	deleteMany?: UserRole[] | null;
// };

interface IBaseResolverOptions<
	T extends Type<unknown>,
	C extends typeof Paginated,
	RC extends Type<unknown>,
	RU extends Type<unknown>,
	BSC extends Type<unknown>,
	BSU extends Type<unknown>,
> {
	entity: {
		single: T;
		connection: C;
	};
	service: {
		create: BSC;
		update: BSU;
	};
	resolver: {
		single?: { roles?: ResolverRoles };
		list?: { roles?: ResolverRoles };
		many?: { roles?: ResolverRoles };
		create: {
			ref: RC;
			roles?: ResolverRoles;
		};
		update: {
			ref: RU;
			roles?: ResolverRoles;
		};
		delete?: {
			roles?: ResolverRoles;
		};
		deleteMany?: { roles?: ResolverRoles };
	};
}

/**
 * Create a base CRUD resolver
 * @param entity.single Entity
 * @param inputType Create resolver input class
 * @param updateType Update resolver input class
 * @param connectionRef Paginated entity type
 * @param connectionFilter Filter object for list response
 * @param resolver.roles Override default role authentication
 */
export const BaseResolver = <
	T extends Type<unknown>,
	C extends typeof Paginated,
	RC extends Type<unknown>,
	RU extends Type<unknown>,
	BSC extends Type<unknown>,
	BSU extends Type<unknown>,
>({
	entity,
	resolver,
}: IBaseResolverOptions<T, C, RC, RU, BSC, BSU>): any => {
	const suffix = entity.single.name.toLowerCase();

	@Resolver({ isAbstract: true })
	abstract class BaseResolverHost {
		constructor(
			private service: IBaseService<T, BSC, BSU>,
			private helperService: HelperService,
		) {}

		@Auth(...(resolver.single?.roles || [UserRole.STAFF, UserRole.ADMIN]))
		@Query(() => entity.single, {
			name: `${suffix}`,
			nullable: true,
			description: `Get a single ${suffix}`,
		})
		async getSingle(@Args('id') id: string): Promise<T | undefined> {
			return this.service.findByID(id);
		}

		@Auth(...(resolver.list?.roles || [UserRole.STAFF, UserRole.ADMIN]))
		@Query(() => entity.connection, {
			name: `${suffix}s`,
			description: `Get a paginated list of ${suffix} objects`,
		})
		async getList(
			@Args()
			{ limit, page: _page, sort, filter }: ConnectionArgs<T>,
		) {
			const page = _page ?? 1;
			const offset = (page - 1) * limit;

			// Get results and number of results
			const [results, count] = await this.service.search(
				limit,
				offset >= 0 ? offset : 0,
				sort,
				filter,
			);

			const edges = results.map((result) => ({
				cursor: this.helperService.toBase64((result as any).id),
				node: result,
			}));

			return {
				edges,
				pageInfo: {
					total: count,
					hasNextPage: page < count / limit,
				},
			};
		}

		@Auth(...(resolver.many?.roles || [UserRole.STAFF, UserRole.ADMIN]))
		@Query(() => entity.connection, {
			name: `${suffix}sMany`,
			description: `Get mutliple ${suffix}s`,
		})
		async getMany(@Args({ name: 'ids', type: () => [ID] }) ids: string[]) {
			const results = await this.service.findByIDs(ids);

			const edges = results.map((result) => ({
				cursor: this.helperService.toBase64((result as any).id),
				node: result,
			}));

			return {
				edges,
				pageInfo: {
					total: results.length,
				},
			};
		}

		@Auth(...(resolver.create?.roles || [UserRole.STAFF, UserRole.ADMIN]))
		@Mutation(() => entity.single, {
			name: `${suffix}Create`,
			nullable: true,
			description: `Create a new ${suffix} object`,
		})
		async create(
			@Args({ name: 'input', type: () => resolver.create.ref }) input: RC,
		): Promise<T | null> {
			return this.service.create(input as any);
		}

		@Auth(...(resolver.update?.roles || [UserRole.STAFF, UserRole.ADMIN]))
		@Mutation(() => entity.single, {
			name: `${suffix}Update`,
			nullable: true,
			description: `Update an existing ${suffix} object`,
		})
		async update(
			@Args({ name: 'id', type: () => ID }) id: string,
			@Args({ name: 'input', type: () => resolver.update.ref }) input: RU,
		): Promise<T | null> {
			const selectedEntity = await this.service.findByID(id);

			if (!selectedEntity)
				throw new APIError(APIErrorCode.NOT_FOUND, suffix);

			return this.service.update(selectedEntity, input as any);
		}

		@Auth(...(resolver.delete?.roles || [UserRole.STAFF, UserRole.ADMIN]))
		@Mutation(() => entity.single, {
			name: `${suffix}Delete`,
			nullable: true,
			description: `Delete existing ${suffix}`,
		})
		async delete(
			@Args({ name: 'id', type: () => ID }) id: string,
		): Promise<T | null> {
			const selectedEntity = await this.service.findByID(id);

			if (!selectedEntity)
				throw new APIError(APIErrorCode.NOT_FOUND, suffix);

			return this.service.delete(selectedEntity);
		}

		@Auth(...(resolver.deleteMany?.roles || [UserRole.ADMIN]))
		@Mutation(() => [ID], {
			name: `${suffix}sDelete`,
			description: `Delete a set of ${suffix}s`,
		})
		async deleteMany(
			@Args({ name: 'ids', type: () => [ID] }) ids: string[],
		): Promise<string[] | null> {
			const deletedIDs = await Promise.all(
				ids.map(async (id) => {
					const entity = await this.service.delete(id);
					if (entity) return id;
					return '';
				}),
			);
			return deletedIDs.filter((id) => id);
		}
	}
	return BaseResolverHost;
};
