import {
	Collection,
	Embedded,
	Entity,
	IdentifiedReference,
	ManyToOne,
	OneToMany,
	Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Node } from '../../common/base/base.entity';
import { Paginated } from '../../common/base/paginated.entity';
import { System } from '../system.entity';
import {
	AWSCredentials,
	AzureCredentials,
	OtherCredentials,
} from './credentials.input';
import { Resource } from './resource/resource.entity';

@Entity()
@ObjectType({ description: 'Single deployement in a system' })
export class Deployment extends Node {
	@Field({ description: 'Deployment name' })
	@Property()
	name: string;

	@ManyToOne(() => System, { wrappedReference: true })
	system: IdentifiedReference<System>;

	@OneToMany(() => Resource, (resource) => resource.deployment)
	resources: Collection<Resource>;

	@Embedded(() => AWSCredentials, {
		nullable: true,
	})
	awsCredentials?: AWSCredentials;

	@Embedded(() => AzureCredentials, {
		nullable: true,
	})
	azureCredentials?: AzureCredentials;

	@Embedded(() => OtherCredentials, {
		nullable: true,
	})
	otherCredentials?: OtherCredentials;
}

@ObjectType({ description: 'Paginated list of deployments' })
export class DeploymentConnection extends Paginated(Deployment) {}
