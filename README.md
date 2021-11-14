<p align="left">
  <a href="http://nestjs.com/" target="blank"><img src="https://cdn.chelsea-apps.com/assets/backend-cover.png" width="100%" alt="Nest Logo" /></a>
</p>

# Chelsea Apps Backend Starter

![Typescript](https://img.shields.io/badge/language-typescript-blue)
![NestJS](https://img.shields.io/badge/framework-nest-red)
![Kubernetes](https://img.shields.io/badge/deployment-kubernetes-brightgreen)

Template for all Chelsea Apps server side components.
This template includes all components needed to get a basic CRUD application running on a kubernetes cluster, with full E2E testing, authentication, and a GraphQL API.

## Features

-   [Nest JS](https://docs.nestjs.com/) project built in Typescript
-   GraphQL
-   Postgres connection
-   Docker & Kubernetes setup and deployments
-   Bitbucket pipelines for linting, testing and deployment
-   JWT token authentication
-   Simple CRUD resource generator
-   Notifications support
    -   Email
    -   SMS
    -   Push (requires provider)
-   Scheduled Jobs
-   Pagination, filtering, sorting, search built in

## Development

### How do I get set up?

1. Clone this repo
2. Change the project name
3. Run `npm run docker` to run the server locally

### How do I add a new resource?

This starter project includes a CRUD resource generator, which, provided a TypeORM entity, can generate a set of GraphQL mutations and queries for basic CRUD applications. These resolvers can easily be overwritten by creating a new resolver with the same name.

Create a new resolver and extend the `BaseResolver` class. The `BaseResolver` class takes a config paramter, where you need to pass in:

-   Entity Type
-   Connection Type for pagination
-   Create & Update GQL inputs
-   Create & Update DTOs for the service
-   A set of roles to apply to resolvers

Resources must have an associated service that implements the `IBaseService` interface. You can extend the BaseService to get a basic service implementation that you can then extend - see the [services section](#working-with-services) for more details.

Example:

```typescript
@Resolver()
export class ArticleResolver extends BaseResolver({
	entity: {
		single: Article,
		connection: ArticleConnection as any,
	},
	service: {
		create: CreateArticleDTO,
		update: UpdateArticleDTO,
	},
	resolver: {
		single: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		list: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		many: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		create: {
			ref: ArticleCreateInput,
			roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF],
		},
		update: {
			ref: ArticleUpdateInput,
			roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF],
		},
	},
}) {
	constructor(articleService: ArticleService, helpersService: HelperService) {
		super(articleService, helpersService);
	}
}
```

### Working with Services

Services are used to interact with the database, and should contain most business logic. The service layer should be agnostic to the transport layer used - ie. to determine if a piece of logic should be in a resolver or in a service, ask yourself:

> Would this application still work the same if a CLI or REST interface was added?

For example, given the following GraphQL mutation

```graphql
mutation CreateArticle($author: String!) {
	articleCreate(author: $author) {
		id
		author
	}
}
```

you should be able to add a CLI command, without rewriting the logic used in the GraphQL mutation.

```
$ api article create --author "Harry Smith"
```

#### Creating a new service

All services that make use of the `BaseResolver` CRUD resource generation must implement the `IBaseService` interface.

The `IBaseService` interface has the following definition:

```typescript
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
```

The interface takes the following generic types:

| Name    | Value             | Example         |
| ------- | ----------------- | --------------- |
| **`T`** | Entity            | `User`          |
| **`C`** | Create entity DTO | `CreateUserDTO` |
| **`U`** | Update entity DTO | `UpdateUserDTO` |

---

While this can be done manually for each resource, this leads to duplication of the same functions over and over again. Instead, it is recommeneded to make use of inheritance and extend the `BaseService` class instead.

The `BaseService` class provides a **basic** implementation for all required functions. It can be used like so:

```typescript
@Injectable()
export class ArticleService extends BaseService<
	User,
	CreateArticleDTO,
	UpdateArticleDTO
> {
	constructor(
		@InjectRepository(Article)
		private articleRepository: Repository<Article>,
		helperService: HelperService,
		configService: ConfigService,
	) {
		super(
			ArticleService.name,
			articleRepository,
			helperService,
			configService,
		);
	}
}
```

Where CreateArticleDTO and UpdateArticleDTO are defined as:

```typescript
export class CreateClassDTO {
	@MinLength(10)
	author: string;
}

export class UpdateClassDTO extends PartialType(CreateClassDTO) {}
```

This will provide a basic `ArticleService` that can be used in `ArticleResolver` by the `BaseResolver` to generate a simple CRUD resource.

However, the `BaseService` is often not enough for most services requiring custom business logic. While the basic functions (`findByID`, `findByIDs`, `findAll`) are enough, the `search`, `create`, `update` and `delete` methods often require custom logic. Utilising inheritance for this makes it simple to extend or even override the base functionality.

For example, to allow searching of more fields than the basic `id` field used in the `search` function, extend it like so:

```typescript
@Injectable()
export class ArticleService extends BaseService<
	User,
	CreateArticleDTO,
	UpdateArticleDTO
> {
	...

	/**
	 * Search for a article, and return a paginated list
	 * @param take Number of articles to return
	 * @param skip Number of results to skip for pagination
	 * @param query Search query (first & last names)
	 */
	async search(
		take?: number,
		skip?: number,
		sort?: ConnectionSort<Article>,
		filter?: ConnectionFilter,
	) {
		const query = new SearchQuery<Article>(this.articleRepository)
			.order(sort as ConnectionSort<Article>)
			.filter(filter?.fields)
			.search(
				[
					{
						field: 'id',
						type: 'id',
					},
					{
						field: 'author',
					},
					{
						field: 'title',
					},
				],
				filter?.query,
			);

		return query.execute(take, skip);
	}

	...
}
```
