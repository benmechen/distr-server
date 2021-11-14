import { INotification, NotificationMethod } from '@chelseaapps/notification';
import mjml2html from 'mjml';
import * as mustache from 'mustache';
import { User } from '../../user/user.entity';

class PasswordResetNotification implements INotification {
	private template = `
    <mjml>
	<mj-head>
		<mj-title>Password Changed</mj-title>
		<mj-attributes>
		<mj-all color="#fff" />
		<mj-class name="bg-blue" background-color="#05164C" />
		<mj-class name="bg-blue-light" background-color="#2B64F6" />
		<mj-class name="text-white" color="#fff" />
		<mj-class name="text-orange" color="#EC602A" />
		<mj-class name="border-orange" border-color="#EC602A" />
		</mj-attributes>
	</mj-head>
	<mj-body mj-class="bg-blue text-white">
		<mj-section padding="100px 0 200px 0">
		<mj-column>
			<mj-image width="300px" src="https://football-exchange-media.s3.eu-west-2.amazonaws.com/web-white-logo.png"></mj-image>
			<mj-divider mj-class="border-orange" padding="4% 0"></mj-divider>
			<mj-text font-size="20px" font-family="helvetica" line-height="1.5" mj-class="text-white">Password Changed</mj-text>
			<mj-text mj-class="text-white" line-height="1.5">Hello, {{ name }}. The password for your \${project-name} account was reset at {{ time }}.</mj-text>
			<mj-text mj-class="text-white" line-height="1.5">If this wasn't you, then please contact <a href="mailto:support@football-exchange.com">support@football-exchange.com</a> to lock your account and change your password.</mj-text>
			>
		</mj-column>
		</mj-section>
	</mj-body>
	</mjml>
    `;

	methods = [NotificationMethod.Email];

	subject = 'Password Changed';

	to: User;

	emailBody: string;

	constructor(user: User, time: Date) {
		const renderedTemplate = this.render(
			this.template,
			user.firstName,
			time.toUTCString(),
		);
		const { html } = this.complile(renderedTemplate);

		if (!html) throw new Error('Unable to compile email to HTML');

		this.to = user;
		this.emailBody = html;
	}

	private render(template: string, name: string, time: string) {
		return mustache.render(template, {
			name,
			time,
		});
	}

	private complile(template: string) {
		return mjml2html(template);
	}
}

export default PasswordResetNotification;
