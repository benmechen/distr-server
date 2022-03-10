import { ApolloError } from 'apollo-server-express';

/**
 * List of predefined error messages, with associated codes
 * Some codes also allow you to specify a resource type
 */
// eslint-disable-next-line
export enum APIErrorCode {
	/**
	 * Not logged in
	 */
	UNAUTHENTICATED = 'You are not logged in',
	/**
	 * User does not have the correct permissions/role
	 */
	UNAUTHORISED = 'You do not have access to that resource',
	/**
	 * The given password is incorrect
	 */
	BAD_PASSWORD = 'Your password is incorrect',
	/**
	 * User already exists with given email
	 */
	USER_EXISTS_EMAIL = 'A user already exists with that email',
	/**
	 * User already exists with given phone
	 */
	USER_EXISTS_PHONE = 'A user already exists with that phone number',
	/**
	 * OTC not found
	 */
	CODE_INCORRECT = 'That code is incorrect, please try again',
	/**
	 * OTC not found
	 */
	CODE_EXPIRED = 'That code has expired, please try again',
	/**
	 * The requested resource could not be found in the database
	 */
	NOT_FOUND = 'That resource does not exist',
	/**
	 * The user's account is locked or on timeout
	 */
	ACCOUNT_LOCKED = 'Your account is locked. Please contact support.',
	/**
	 * The user's account is on timeout
	 */
	ACCOUNT_TIMEOUT = 'Your account is locked for resource.',
	/**
	 * The given ID is not a valid UUID
	 */
	INVALID_ID = 'That resource does not exist',
	/**
	 * The given token was invalid
	 */
	INVALID_TOKEN = 'That token is not valid',
	/**
	 * The given entity type was not an the accepted types
	 */
	INVALID_ENTITY_TYPE = 'resource is not a valid entity type',
	/**
	 * The given proto file did not have the methods required in the specification
	 */
	INVALID_SERVICE_DEFINITION = 'The given service does not match the specification',
	/**
	 * The resource already exists
	 */
	EXISTS = 'That resource already exists',
	/**
	 * The user still owns shares or has funds in their account
	 */
	CANNOT_DELETE = 'You must close your open positions and withraw any remaining money before you can delete your account',
	/**
	 * Invalid date (e.g in the past)
	 */
	INVALID_DATE = 'Invalid date provided',
	/**
	 * Terms of service (e.g hasn't agreed)
	 */
	TERMS_OF_SERVICE = 'You must agree to the Terms Of Service',
	/**
	 * Invalid address (e.g not including all fields or invalid postcode)
	 */
	INVALID_ADDRESS = 'Invalid address or missing fields',
	/**
	 * The given token was not of the correct type
	 */
	INVALID_TOKEN_TYPE = 'You did not provide a resource token',
	/**
	 * The given phone number was not a valid UK phone number
	 */
	INVALID_PHONE = 'That is not a value phone number. Numbers must be in the form +447#########',
	/**
	 * The service returned a non-true status value
	 */
	SERVICE_CREATE_ERROR = 'Unable to create the resource due to an error with the service',
}

/**
 * System wide error, designed for the error formatter
 */
export class APIError extends ApolloError {
	/**
	 * Throw an error, conforming to system error formatter expected format
	 * @param code Defined code (as APIErrorCode enum) with associated value
	 * @param resource User to replace occurences of "resource" in the error message, if present
	 */
	constructor(code: APIErrorCode, resource?: string) {
		// Extract error message from enum
		const keys = Object.keys(APIErrorCode).filter(
			(x) => (APIErrorCode as Record<string, string>)[x] === code,
		);

		let message: string = code;
		if (resource)
			message = code.replace(/resource/g, resource.toLowerCase());

		super(message, keys[0] ?? 'Internal Server Error');
	}
}
