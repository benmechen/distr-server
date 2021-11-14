import { BaseEmailTemplate } from '../../notification/template.notification';
import { User } from '../user.entity';

interface IUserCreatedNotificationParameters {
	name: string;
}

class UserCreatedNotification extends BaseEmailTemplate<IUserCreatedNotificationParameters> {
	subject = 'Welcome to ${project-name}!';

	protected template = `
        <mj-text mj-class="header-text" css-class="header-text-c">Welcome to {project-name}!</mj-text>
        <mj-text mj-class="body-text" color="#24382e">Hi, {{ name }}!</mj-text>
        <mj-text mj-class="body-text">Thank you for signing up and welcome to the platform!</mj-text>
    `;

	constructor(user: User) {
		super(user, {
			name: user.firstName,
		});
	}
}

export default UserCreatedNotification;
