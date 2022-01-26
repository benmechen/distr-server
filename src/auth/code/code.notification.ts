import { INotification, NotificationMethod } from '@chelseaapps/notification';
import { User } from '../../user/user.entity';

class CodeNotification implements INotification {
	methods = [NotificationMethod.SMS];

	to: User;

	smsBody: string;

	constructor(phone: string, code: string) {
		// Notification service expects users, but OTCs don't work with users, just identifiers
		this.to = User.of({
			// phone,
		});

		this.smsBody = `Your {project-name} verification code is: ${code}`;
	}
}

export default CodeNotification;
