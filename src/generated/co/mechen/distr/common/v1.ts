/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'co.mechen.distr.common.v1';

export enum Method {
	GET = 0,
	CREATE = 1,
	UPDATE = 2,
	DELETE = 3,
	UNRECOGNIZED = -1,
}

export enum Status {
	HEALTHY = 0,
	DEGRADED = 1,
	DOWN = 2,
	UNRECOGNIZED = -1,
}

export enum UsageType {
	LIMITED = 0,
	UNLIMITED = 1,
	UNRECOGNIZED = -1,
}

export interface Value {
	stringValue: string | undefined;
	numberValue: number | undefined;
	boolValue: boolean | undefined;
	structValue: Struct | undefined;
}

export interface Struct {
	fields: { [key: string]: Value };
}

export interface Struct_FieldsEntry {
	key: string;
	value: Value | undefined;
}

export interface Field {
	name: string;
	description?: string | undefined;
	defaultValue?: Value | undefined;
	required: boolean;
	type: Field_Type;
	fields: { [key: string]: Field };
}

export enum Field_Type {
	STRING = 0,
	NUMBER = 1,
	BOOLEAN = 2,
	STRUCT = 3,
	UNRECOGNIZED = -1,
}

export interface Field_FieldsEntry {
	key: string;
	value: Field | undefined;
}

export interface Input {
	name: string;
	value: Value | undefined;
}

export interface Property {
	name: string;
	value: Value | undefined;
}

export interface ReflectMethodRequest {
	method: Method;
}

export interface ReflectMethodResponse {
	method: Method;
	inputs: Field[];
	outputs: Field[];
}

/** API Credentials */
export interface AWSCredentials {
	id: string;
	secret: string;
	region: string;
}

export interface AzureCredentials {
	tenantId: string;
	clientId: string;
	secret: string;
}

export interface OtherCredentials {
	values: { [key: string]: string };
}

export interface OtherCredentials_ValuesEntry {
	key: string;
	value: string;
}

export interface Credentials {
	aws?: AWSCredentials | undefined;
	azure?: AzureCredentials | undefined;
	other?: OtherCredentials | undefined;
}

/**
 * METHODS
 * Get
 */
export interface GetRequest {
	credentials: Credentials | undefined;
	resourceId: string;
}

export interface GetResponse {
	properties: Property[];
}

/** Status */
export interface StatusRequest {
	credentials: Credentials | undefined;
	resourceId: string;
}

export interface StatusResponse {
	status: Status;
}

/** Usage */
export interface UsageRequest {
	credentials: Credentials | undefined;
	resourceId: string;
}

export interface UsageResponse {
	type: UsageType;
	current?: number | undefined;
	limit?: number | undefined;
}

/** Create */
export interface CreateRequest {
	credentials: Credentials | undefined;
	resourceId: string;
	payload: Input[];
}

export interface CreateResponse {
	status: boolean;
	properties: Property[];
}

/** Update */
export interface UpdateRequest {
	credentials: Credentials | undefined;
	resourceId: string;
	payload: Input[];
}

export interface UpdateResponse {
	status: boolean;
	properties: Property[];
}

/** Delete */
export interface DeleteRequest {
	credentials: Credentials | undefined;
	resourceId: string;
	payload: Input[];
}

export interface DeleteResponse {
	status: boolean;
}

export const CO_MECHEN_DISTR_COMMON_V1_PACKAGE_NAME =
	'co.mechen.distr.common.v1';

if (_m0.util.Long !== Long) {
	_m0.util.Long = Long as any;
	_m0.configure();
}
