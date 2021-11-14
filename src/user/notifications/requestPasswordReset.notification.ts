import { INotification, NotificationMethod } from '@chelseaapps/notification';
import mjml2html from 'mjml';
import * as mustache from 'mustache';
import { User } from '../user.entity';

class RequestPasswordResetNotification implements INotification {
	private template = `
    <mjml>
        <mj-head>
            <mj-title>\${project-name} Requested Password Reset</mj-title>
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
                    <mj-image
                        width="300px"
                        src="https://football-exchange-media.s3.eu-west-2.amazonaws.com/web-white-logo.png"
                    ></mj-image>
                    <mj-divider mj-class="border-orange" padding="4% 0"></mj-divider>
                    <mj-text
                        font-size="20px"
                        font-family="helvetica"
                        line-height="1.5"
                        mj-class="text-white"
                        >You've requested a password reset on your \${project-name} account.</mj-text
                    >
                    <mj-text mj-class="text-white" line-height="1.5">Hello, {{ name }}! Someone has requested a password reset for your account. If this was indeed you, please follow the link below. If not, you may safely ignore this email.</mj-text
                    >
                    <mj-button href="{{ link }}" mj-class="bg-blue-light" padding-top="10%">Reset Password</mj-button>
                </mj-column>
            </mj-section>
        </mj-body>
    </mjml>
    `;

	methods = [NotificationMethod.Email];

	subject = '${project-name} Password Reset';

	to: User;

	emailBody: string;

	constructor(user: User, baseURL: string, token: string) {
		const link = `${baseURL}/resetpassword/${token}`;
		const renderedTemplate = this.render(
			this.template,
			user.firstName,
			link,
		);
		const { html } = this.complile(renderedTemplate);

		if (!html) throw new Error('Unable to compile email to HTTP');

		this.to = user;
		this.emailBody = html;
	}

	private render(template: string, name: string, link: string) {
		return mustache.render(template, {
			name,
			link,
		});
	}

	private complile(template: string) {
		return mjml2html(template);
	}
}

export default RequestPasswordResetNotification;
