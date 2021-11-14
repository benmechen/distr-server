import { ConfigService } from '@nestjs/config';
import { DeepPartial, Repository } from 'typeorm';
import { Logger } from 'winston';
import { APIError, APIErrorCode } from '../api.error';
import { HelperService } from '../helper/helper.service';
import { LoggerFactory } from '../logger';
import { SearchQuery } from '../search.builder';
import { Node } from './base.entity';
import { ConnectionFilter } from './connection.filter';
import { ConnectionSort } from './connection.sort';

export interface IBaseService<T, C, U> {
	findByID(id: string): Promise<T | undefined>;
	findByIDs(ids: string[]): Promise<T[]>;
	findAll(): Promise<T[]>;
	search(
		take: number | undefined,
		skip: number | undefined,
		sort: ConnectionSort<T> | undefined,
		filter: ConnectionFilter | undefined,
	): Promise<[T[], number]>;
	create(input: C): Promise<T>;
	update(entity: T, input: U): Promise<T>;
	delete(entity: string | T): Promise<T | null>;
}

export class BaseService<T extends Node, C, U>
	implements IBaseService<T, C, U>
{
	protected logger: Logger;

	constructor(
		name: string,
		protected repository: Repository<T>,
		protected helperService: HelperService,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(name);
	}

	/**
	 * Find a single entity by its ID
	 * @param id UUID to query
	 */
	async findByID(id: string): Promise<T | undefined> {
		if (!this.helperService.isValidID(id))
			throw new APIError(APIErrorCode.INVALID_ID);

		this.logger.debug('findByID', { id });

		return this.repository.findOne(id);
	}

	/**
	 * Find multiple entities by their IDs
	 * @param ids UUIDs to query
	 */
	async findByIDs(ids: string[]): Promise<T[]> {
		ids.forEach((id) => {
			if (!this.helperService.isValidID(id))
				throw new APIError(APIErrorCode.INVALID_ID);
		});

		this.logger.debug('findByIDs', { ids });

		return this.repository.findByIds(ids);
	}

	/**
	 * Get all entites
	 */
	async findAll(): Promise<T[]> {
		this.logger.debug('findAll');
		return this.repository.find();
	}

	/**
	 * Search for an entity, and return a paginated list
	 * @param take Number of results to return
	 * @param skip Number of results to skip for pagination
	 * @param query Search query (id)
	 */
	async search(
		take?: number,
		skip?: number,
		sort?: ConnectionSort<T>,
		filter?: ConnectionFilter,
	) {
		this.logger.debug('search', { take, skip, sort, filter });

		const query = new SearchQuery<T>(this.repository)
			.order(sort)
			.filter(filter?.fields)
			.search(
				[
					{
						field: 'id',
						type: 'id',
					},
				],
				filter?.query,
			);

		return query.execute(take, skip);
	}

	/**
	 * Create a new entity and save to the data store
	 * @param input EntityInput object
	 */
	async create(input: C): Promise<T> {
		this.logger.info('create', { input });

		return this.repository.save(input);
	}

	/**
	 * Update an entity object and save to the data store
	 * Only updates fields that are set in the input
	 * @param entity Entity object to update
	 * @param input Input containing requiring update
	 */
	async update(entity: T, input: U): Promise<T> {
		this.logger.info('update', { entity, input });

		const updatedUser = await this.repository.save({
			...entity,
			...input,
		});
		return updatedUser;
	}

	/**
	 * Delete an entity either by its ID or by providing an entity object
	 * @param entity ID as a string, or an entity object
	 * @returns The provided entity/ID if successfull, otherwise null
	 */
	delete(entity: string): Promise<T | null>;

	delete(entity: T): Promise<T | null>;

	async delete(entity: string | T): Promise<T | null> {
		let _entity: T | undefined;
		if (typeof entity === 'string') {
			// ID was passed in
			_entity = await this.findByID(entity);
		} else {
			// Otherwise user was passed in
			_entity = entity;
		}

		if (!_entity) return null;

		this.logger.info('delete', { _entity });

		return this.repository.softRemove(_entity as unknown as DeepPartial<T>);
	}
}
