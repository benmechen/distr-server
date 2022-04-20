import {
	EntityRepository,
	FilterQuery,
	RequiredEntityData,
	wrap,
} from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { APIError, APIErrorCode } from '../api.error';
import { HelperService } from '../helper/helper.service';
import { LoggerFactory } from '../logger';
import { Node } from './base.entity';
import { ConnectionFilter } from './connection.filter';
import { ConnectionSort } from './connection.sort';

export interface IBaseService<T, C extends RequiredEntityData<T>, U> {
	findByID(id: string): Promise<T | null>;
	findByIDOrFail(id: string): Promise<T>;
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

export class BaseService<T extends Node, C extends RequiredEntityData<T>, U>
	implements IBaseService<T, C, U>
{
	protected logger: Logger;

	constructor(
		name: string,
		protected repository: EntityRepository<T>,
		protected helperService: HelperService,
		configService: ConfigService,
	) {
		this.logger = new LoggerFactory(configService).getLogger(name);
	}

	/**
	 * Find a single entity by its ID
	 * @param id UUID to query
	 */
	async findByID(id: string, populate?: (keyof T)[]): Promise<T | null> {
		if (!this.helperService.isValidID(id))
			throw new APIError(APIErrorCode.INVALID_ID);

		this.logger.debug('findByID', { id, populate });

		return this.repository.findOne({
			id,
		} as FilterQuery<T>);
	}

	/**
	 * Find a single entity by its ID, or throw an error if it does not exist
	 * @param id UUID to query
	 */
	async findByIDOrFail(id: string, populate?: (keyof T)[]): Promise<T> {
		this.logger.debug('findByIDOrFail', { id, populate });

		const entity = await this.findByID(id, populate);
		if (!entity) throw new APIError(APIErrorCode.NOT_FOUND);

		return entity;
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

		// return this.repository.find({
		// 	[PrimaryKeyType]: In,
		// });

		return [];
	}

	/**
	 * Get all entites
	 */
	async findAll(): Promise<T[]> {
		this.logger.debug('findAll');
		return this.repository.findAll();
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
	): Promise<[T[], number]> {
		this.logger.debug('search', { take, skip, sort, filter });

		// const query = new SearchQuery<T>(this.repository)
		// 	.order(sort)
		// 	.filter(filter?.fields)
		// 	.search(
		// 		[
		// 			{
		// 				field: 'id',
		// 				type: 'id',
		// 			},
		// 		],
		// 		filter?.query,
		// 	);

		// return query.execute(take, skip);
		return [[], 0];
	}

	/**
	 * Create a new entity and save to the data store
	 * @param input EntityInput object
	 */
	async create(input: C, flush = true): Promise<T> {
		this.logger.info('create', { input });

		const entity = this.repository.create(input);
		wrap(entity);

		if (flush) await this.repository.persistAndFlush(entity);
		else this.repository.persist(entity);

		return entity;
	}

	/**
	 * Update an entity object and save to the data store
	 * Only updates fields that are set in the input
	 * @param entity Entity object to update
	 * @param input Input containing requiring update
	 */
	async update(entity: T, input: U, flush = true): Promise<T> {
		this.logger.info('update', { entity, input });

		const e = this.repository.assign(entity, input);
		this.repository.persist(e);

		if (flush) await this.repository.flush();

		return e;
	}

	/**
	 * Delete an entity either by its ID or by providing an entity object
	 * @param entity ID as a string, or an entity object
	 * @returns The provided entity/ID if successfull, otherwise null
	 */
	async delete(entity: string | T, flush = true): Promise<T | null> {
		let _entity: T | null;
		if (typeof entity === 'string') {
			// ID was passed in
			_entity = await this.findByID(entity);
		} else {
			// Otherwise user was passed in
			_entity = entity;
		}

		if (!_entity) return null;

		this.logger.info('delete', { _entity });

		// return this.repository.softRemove(_entity as unknown as DeepPartial<T>);
		this.repository.remove(_entity);

		if (flush) await this.repository.flush();

		return _entity;
	}
}
