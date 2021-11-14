import { UserUpdateInput } from '../update/update.input';

export class UpdateUserDTO extends UserUpdateInput {
	timeout?: Date | null;

	loginAttempts?: number;
}
