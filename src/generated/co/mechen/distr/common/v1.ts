/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'co.mechen.distr.common.v1';

export enum Method {
	CREATE = 0,
	UPDATE = 1,
	DELETE = 2,
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

export interface InputField {
	name: string;
	description?: string | undefined;
	defaultValue?: Value | undefined;
	type: InputField_Type;
	fields: { [key: string]: InputField };
}

export enum InputField_Type {
	STRING = 0,
	NUMBER = 1,
	BOOLEAN = 2,
	STRUCT = 3,
	UNRECOGNIZED = -1,
}

export interface InputField_FieldsEntry {
	key: string;
	value: InputField | undefined;
}

export interface Input {
	name: string;
	value: Value | undefined;
}

export interface ReflectMethodRequest {
	method: Method;
}

export interface ReflectMethodResponse {
	method: Method;
	inputs: InputField[];
}

/** API Credentials */
export interface AWSCredentials {
	id: string;
	secret: string;
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

/** Methods */
export interface CreateRequest {
	credentials: Credentials | undefined;
	payload: Input[];
}

export interface CreateResponse {
	status: boolean;
}

export const CO_MECHEN_DISTR_COMMON_V1_PACKAGE_NAME =
	'co.mechen.distr.common.v1';

if (_m0.util.Long !== Long) {
	_m0.util.Long = Long as any;
	_m0.configure();
}
