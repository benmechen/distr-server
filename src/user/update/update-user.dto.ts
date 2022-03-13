import { Organisation } from '../../organisation/organisation.entity';
import { UserUpdateInput } from './update.input';

export class UpdateUserDTO extends UserUpdateInput {
	timeout?: Date | null;

	loginAttempts?: number;

	organisation?: Organisation;
}
