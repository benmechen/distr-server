import { EntityName } from '@mikro-orm/core';
import { EntityManager, Knex } from '@mikro-orm/mysql';
import { Node } from './base/base.entity';
import { ConnectionFieldFilter } from './base/connection.filter';
import { ConnectionSort } from './base/connection.sort';
import { HelperService } from './helper/helper.service';

export class SearchQuery<T extends Node> {
	private queryBuilder: Knex.QueryBuilder<T, T>;

	private helperService = new HelperService();

	constructor(
		private readonly manager: EntityManager,
		private readonly entity: EntityName<T>,
	) {
		this.queryBuilder = manager.createQueryBuilder(entity).getKnexQuery();
	}

	/**
	 * Get the list of matching objects and the total amount
	 * @param take Number of items to take
	 * @param skip Number of items to skip
	 */
	async execute(take?: number, skip?: number): Promise<[T[], number]> {
		if (take != null) this.queryBuilder.limit(take);
		if (skip != null) this.queryBuilder.offset(skip);

		const results = await this.manager.execute(this.queryBuilder);
		const entities = results.map((e) => this.manager.map(this.entity, e));
		this.queryBuilder.count();
		const counts = await this.manager.execute(this.queryBuilder);
		const count = counts[0];

		return [entities, count ? +count : 0];
	}

	/**
	 * Get the underlying query builder
	 */
	getQueryBuilder(): Knex.QueryBuilder<T, T> {
		return this.queryBuilder;
	}

	/**
	 * Apply an order to the search
	 * @param sort Field and order
	 * @default sort Sorts by `created` field in descending order by default
	 */
	order(sort?: ConnectionSort<T>): SearchQuery<T> {
		this.queryBuilder.orderBy(`${sort?.field ?? 'created'}`, sort?.order);
		return this;
	}

	/**
	 * Apply a set of filters where the fields must match exactly
	 * @param fields Connection Field Filters
	 */
	filter(fields?: ConnectionFieldFilter[]): SearchQuery<T> {
		if (!fields) return this;

		fields.forEach((item) =>
			this.queryBuilder.andWhere(`${item.field} = ?`, [item.value]),
		);

		return this;
	}

	/**
	 * Search by a query against a set of fields
	 * @param fields Fields containing a field name and parent. If no parent is given, the default resource will be used.
	 * @param query Like string query
	 */
	search(
		fields: { field: string; parent?: string; type?: 'id' | 'string' }[],
		query?: string,
	): SearchQuery<T> {
		if (query && query.trim().length > 0) {
			const expr = `%${query}%`;
			this.queryBuilder.andWhere((builder) => {
				fields.forEach((item) => {
					if (item.type === 'id') {
						// Don't search if not ID
						if (this.helperService.isValidID(query))
							builder.orWhere(
								`${item.parent ? `${item.parent}".` : ''}${
									item.field
								}`,
								expr,
							);
					} else {
						// Otherwise search by text
						builder.orWhere(
							`${item.parent ? `${item.parent}".` : ''}${
								item.field
							}`,
							'LIKE',
							expr,
						);
					}
				});
			});
		}

		return this;
	}
}
