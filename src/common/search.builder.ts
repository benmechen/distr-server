import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Node } from './base/base.entity';
import { ConnectionFieldFilter } from './base/connection.filter';
import { ConnectionSort } from './base/connection.sort';
import { HelperService } from './helper/helper.service';

export class SearchQuery<T extends Node> {
	private queryBuilder: SelectQueryBuilder<T>;

	private helperService = new HelperService();

	private resource: string;

	constructor(repository: Repository<T>) {
		this.resource = repository.metadata.name.toLowerCase();
		this.queryBuilder = repository.createQueryBuilder(this.resource);
	}

	/**
	 * Get the list of matching objects and the total amount
	 * @param take Number of items to take
	 * @param skip Number of items to skip
	 */
	execute(take?: number, skip?: number): Promise<[T[], number]> {
		if (take != null) this.queryBuilder.take(take);
		if (skip != null) this.queryBuilder.skip(skip);

		return this.queryBuilder.getManyAndCount();
	}

	/**
	 * Get the underlying query builder
	 */
	getQueryBuilder(): SelectQueryBuilder<T> {
		return this.queryBuilder;
	}

	/**
	 * Apply an order to the search
	 * @param sort Field and order
	 * @default sort Sorts by `created` field in descending order by default
	 */
	order(sort?: ConnectionSort<T>): SearchQuery<T> {
		this.queryBuilder.orderBy(
			`${this.resource}.${sort?.field ?? 'created'}`,
			(sort?.order.toString() as any | undefined) ?? 'DESC',
		);
		return this;
	}

	/**
	 * Apply a set of filters where the fields must match exactly
	 * @param fields Connection Field Filters
	 */
	filter(fields?: ConnectionFieldFilter[]): SearchQuery<T> {
		this.queryBuilder.where(
			new Brackets((subQb) => {
				fields?.forEach((item, index) => {
					const id = `value${index}`;
					const params: Record<string, any> = {};
					params[id] = item.value;

					subQb.andWhere(
						`${this.resource}.${item.field} In(:...${id})`,
						params,
					);
				});
			}),
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
			this.queryBuilder.andWhere(
				new Brackets((subQb) =>
					fields.forEach((item) => {
						if (item.type === 'id') {
							// Don't search if not ID
							if (this.helperService.isValidID(query))
								subQb.orWhere(
									`"${item.parent ?? this.resource}"."${
										item.field
									}" = :query`,
									{ query },
								);
						} else {
							// Otherwise search by text
							subQb.orWhere(
								`"${item.parent ?? this.resource}"."${
									item.field
								}" ILIKE :query`,
								{ query: expr },
							);
						}
					}),
				),
			);
		}

		return this;
	}
}
