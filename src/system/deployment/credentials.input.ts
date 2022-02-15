/* eslint-disable max-classes-per-file */
import { Embeddable, Property } from '@mikro-orm/core';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import JSON from 'graphql-type-json';
import {
	AWSCredentials as IAWSCredentials,
	AzureCredentials as IAzureCredentials,
	OtherCredentials as IOtherCredentials,
} from '../../generated/co/mechen/distr/common/v1';

@InputType()
@ObjectType()
@Embeddable()
export class AWSCredentials implements IAWSCredentials {
	@Field()
	@Property()
	id: string;

	@Field()
	@Property()
	secret: string;
}

@InputType()
@ObjectType()
@Embeddable()
export class AzureCredentials implements IAzureCredentials {
	@Field()
	@Property()
	tenantId: string;

	@Field()
	@Property()
	clientId: string;

	@Field()
	@Property()
	secret: string;
}

@InputType()
@ObjectType()
@Embeddable()
export class OtherCredentials implements IOtherCredentials {
	@Field(() => JSON)
	@Property({
		type: 'json',
	})
	values: { [key: string]: string };
}

@InputType()
export class DeploymentCredentialsInput {
	@Field(() => AWSCredentials, { nullable: true })
	aws?: AWSCredentials;

	@Field(() => AzureCredentials, { nullable: true })
	azure?: AzureCredentials;

	@Field(() => OtherCredentials, { nullable: true })
	other?: OtherCredentials;
}
