import { Injectable } from '@nestjs/common';
import { Connection, In, ObjectID } from 'typeorm';
import * as fs from 'fs';
import * as faker from 'faker';
import { ConfigService } from '@nestjs/config';
import { User } from '../../user/user.entity';
import { Article } from '../../article/article.entity';
import { ConnectionSort } from '../base/connection.sort';
import { ConnectionFilter } from '../base/connection.filter';
import { ConfigException } from './config.exception';

interface IInsertMock {
	into: IInsertMock;
	values: IInsertMock;
	execute: IInsertMock;
}

interface IUpdateMock {
	set: IUpdateMock;
	where: IUpdateMock;
	execute: IUpdateMock;
}

interface IQueryBuilderMock {
	select: () => IQueryBuilderMock;
	where: () => IQueryBuilderMock;
	orderBy: () => IQueryBuilderMock;
	limit: () => IQueryBuilderMock;
	value: () => IQueryBuilderMock;
	insert: () => IInsertMock;
	update: () => IUpdateMock;
	execute: () => IQueryBuilderMock;
}

interface IManagerMock {
	createQueryBuilder: () => IQueryBuilderMock;
}

@Injectable()
export class HelperService {
	constructor(private configService?: ConfigService) {}

	/**
	 * Get a value from the config service, or throw an error if not given
	 * @param key Env variable name
	 * @throws If config service is not in scope or variable does not exist
	 * @returns Value
	 */
	getFromConfig<T>(key: string) {
		if (!this.configService) throw new Error('No config service given');

		const value = this.configService.get<T>(key);

		if (!value || (typeof value === 'string' && value.trim().length === 0))
			throw new ConfigException(key);

		return value;
	}

	/**
	 * Check if ID is a valid UUID
	 * @param id ID to check
	 * @returns A boolean value indicating if the ID is a valid UUID
	 */
	isValidID(id?: string | number | Date | ObjectID): boolean {
		return !!id
			?.toString()
			.match(/^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i);
	}

	/**
	 * Convert a string to Base64 format
	 * @param data String to convert
	 */
	toBase64(data: string) {
		return Buffer.from(data, 'binary').toString('base64');
	}

	/**
	 * Get a string from a Base64 encoded value
	 * @param data String to convert
	 */
	fromBase64(data: string) {
		return Buffer.from(data, 'base64').toString('binary');
	}

	/**
	 * Calculate an age of an entity in years from creation date
	 * @param creation Date of when entity was created
	 */
	calculateAge(creation: Date) {
		const dif = Date.now() - creation.getTime();
		const creationDate = new Date(dif);
		return Math.abs(creationDate.getUTCFullYear() - 1970);
	}

	/**
	 * Capitalise first letter of a string
	 * @param value String value
	 */
	capitaliseFirst(value: string) {
		return `${value.charAt(0).toUpperCase()}${value
			.slice(1)
			.toLocaleLowerCase()}`;
	}

	/**
	 * Remove accents and the like from a string
	 * @param data String to remove accents from
	 */
	removeAccents(data: string) {
		return data.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	/**
	 * Load a query from a .graphql file.
	 * @summary The query must be in the directory specified, in the format "query.graphql"
	 * @param dirname Directory containing file
	 * @param query Name of the query
	 */
	useQuery(dirname: string, query: string) {
		return fs.readFileSync(`${dirname}/${query}.graphql`, 'utf8');
	}

	/**
	 * Create & start a new Query Runner and begin a transaction
	 * @param connection Database connection
	 * @param transaction Should a transaction be started on the QR? Defaults to `true`
	 */
	async queryRunnerFactory(connection: Connection, transaction = true) {
		const queryRunner = connection.createQueryRunner();
		await queryRunner.connect();
		if (transaction) await queryRunner.startTransaction();
		return queryRunner;
	}

	/**
	 * Serialise filter & sort GQL inputs to Typeorm compatible objects
	 * @param sort Sort arg
	 * @param filter Filter arg
	 */
	connectionInputToFilters<T>(
		sort?: ConnectionSort<T>,
		filter?: ConnectionFilter,
	): {
		order: Record<string, any>;
		filters: Record<string, any>;
	} {
		const order: Record<string, any> = {} as any;
		if (sort) order[sort.field as string] = sort.order;

		// Filter each field with given value
		const filters: Record<string, any> = {};
		if (filter?.fields) {
			filter.fields.forEach((field) => {
				filters[field.field] = In(field.value);
			});
		}

		return { order, filters };
	}

	filterToSqlStringAndValues(
		filter?: ConnectionFilter,
		prefix?: string,
		query?: string,
		likeColumns?: string[],
	): [
		externalSqlString: string | undefined,
		externalSqlValues: (string | number)[] | undefined,
	] {
		const externalSqlStringArr: string[] = [];
		const externalSqlValues: (string | number)[] = [];
		let whereStatementIndex = 1;
		if (
			(!filter?.fields || filter.fields.length === 0) &&
			!query &&
			(!likeColumns || likeColumns.length === 0)
		)
			return [undefined, undefined];
		if (filter && filter.fields) {
			filter.fields.forEach((field) => {
				const isMultipleValues = field.value.length > 1;
				const inStatement: string[] = [];
				if (isMultipleValues) {
					field.value.forEach((value) => {
						externalSqlValues.push(value);
						inStatement.push(`$${whereStatementIndex}`);
						whereStatementIndex += 1;
					});
				}
				externalSqlStringArr.push(
					`${prefix ? `${prefix}.` : ''}"${
						field.field === 'club' ? 'clubId' : field.field
					}" ${isMultipleValues ? 'IN' : '='} ${
						isMultipleValues
							? `(${inStatement.join(',')})`
							: `$${whereStatementIndex}`
					}`,
				);
				if (!isMultipleValues) {
					externalSqlValues.push(field.value[0]);
					whereStatementIndex += 1;
				}
			});
		}
		const externalSqlLikeStringArr: string[] = [];
		if (query && likeColumns && likeColumns.length > 0) {
			externalSqlValues.push(`%${query}%`);
			likeColumns.forEach((column) => {
				externalSqlLikeStringArr.push(
					`${prefix ? `${prefix}.` : ''}"${column}" ILIKE $${
						externalSqlValues.length
					}`,
				);
			});
		}
		const isLikeString =
			externalSqlLikeStringArr && externalSqlLikeStringArr.length > 0;
		const isExactString =
			externalSqlStringArr && externalSqlStringArr.length > 0;
		const externalSqlString = `${
			isExactString ? `(${externalSqlStringArr.join(' OR ')})` : ''
		}${isLikeString && isExactString ? ' AND ' : ''}${
			isLikeString ? `(${externalSqlLikeStringArr.join(' OR ')})` : ''
		}`;
		return [externalSqlString, externalSqlValues];
	}

	dateToSqlString(date: Date) {
		return date.toISOString().slice(0, 19).replace('T', ' ');
	}

	/**
	 * Return a dummy user for use in tests
	 */
	createTestUser() {
		// Set date to 18 years ago
		const date = new Date();
		date.setFullYear(date.getFullYear() - 18);
		return User.of({
			id: faker.datatype.uuid(),
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName(),
			email: faker.internet.email().toLowerCase(),
			password: faker.internet.password(),
			created: new Date(),
			updated: new Date(),
		});
	}

	createTestClient() {
		return {
			ip: faker.internet.ip(),
			date: new Date(),
			agent: faker.internet.userAgent(),
		};
	}

	createTestArticle() {
		return Article.of({
			id: faker.datatype.uuid(),
			title: faker.lorem.lines(1),
			image: faker.internet.url(),
			teaser: faker.lorem.sentence(),
			publisher: faker.name.firstName(),
			body: faker.lorem.paragraph(),
		});
	}

	mockConnection(): {
		createQueryRunner: () => {
			connect: () => void;
			startTransaction: () => void;
			commitTransaction: () => void;
			rollbackTransaction: () => void;
			release: () => void;
			manager: IManagerMock;
		};
	} {
		const managerMock: IManagerMock = {
			createQueryBuilder: jest.fn().mockReturnValue({
				select: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				value: jest.fn().mockReturnThis(),
				insert: jest.fn().mockReturnValue({
					into: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
					onConflict: jest.fn().mockReturnThis(),
					setParameter: jest.fn().mockReturnThis(),
					execute: jest.fn().mockReturnThis(),
				}),
				update: jest.fn().mockReturnValue({
					set: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					execute: jest.fn().mockReturnThis(),
				}),
				execute: jest.fn().mockReturnThis(),
			}),
		};
		return {
			createQueryRunner: jest.fn().mockReturnValue({
				connect: jest.fn(),
				startTransaction: jest.fn(),
				commitTransaction: jest.fn(),
				rollbackTransaction: jest.fn(),
				release: jest.fn(),
				manager: managerMock,
				connection: {
					queryResultCache: {
						remove: jest.fn(),
					},
				},
			}),
		};
	}
}
