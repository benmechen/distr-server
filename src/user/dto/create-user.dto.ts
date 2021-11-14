import { OmitType } from '@nestjs/graphql';
import { UserCreateInput } from '../create/create.input';
import { TermsOfService, UserRole } from '../user.entity';

export class CreateUserDTO extends OmitType(UserCreateInput, [
	'tos',
	'verification',
] as const) {
	tos: TermsOfService;

	role: UserRole;
}
