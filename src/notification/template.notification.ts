import { INotification, NotificationMethod } from '@chelseaapps/notification';
import mjml2html from 'mjml';
import mustache from 'mustache';
import { User } from '../user/user.entity';

/**
 * Default email template.
 * @description
 * Use this to set a base email template into which content can be inserted.
 * Takes 1 type parameter, `T`, which is used to type the email parameters for rendering.
 * Use the following properties:
 * - `subject` - Set the email's subject
 * - `template` - Set the email's body. This is inserted into the default template.
 *
 * The following properties can also be set
 * - `methods` - Add more delivery methods to the notification. You'll need to implement `INotification` in the child class to have full access to the necessary properties.
 * - `emailBody` - HTML email body, can be overridden to skip MJML
 *
 * @example
 * interface ITestNotificationParameters {
 * 	 name: string;
 * }
 *
 * export class TestNotification extends BaseEmailTemplate<ITestNotificationParameters> {
 *      subject = 'Test subject';
 *
 *      template = `
 *          <mj-text mj-class="header-text" css-class="header-text-c">Welcome to project-name!</mj-text>
 *      `;
 *
 *      constructor(to: User, name: string) {
 *          super(to, {
 *              name,
 *          });
 *      }
 * }
 */
export class BaseEmailTemplate<T> implements INotification {
	/**
	 * Set this parameter to change the subject
	 */
	subject = '${project-name}';

	/**
	 * Add more notification methods here
	 * @description You'll need to implement the `INotification` class in the
	 * child notification to full access to the rest of the notification options
	 */
	methods = [NotificationMethod.Email];

	/**
	 * Select user or users to send to
	 */
	to: User | User[];

	/**
	 * This parameter can be used to override the email body
	 * if you do not wish to use the default email template
	 */
	emailBody: string;

	/**
	 * Set this parameter to set the email body content
	 */
	protected template = '';

	/**
	 * Build the email template
	 * @description Change this to modify the default email style
	 * @param title Email title
	 * @param body Email body
	 * @returns Full email body
	 */
	private buildTemplate = (title: string, body: string) => `
    <mjml>
        <mj-head>
            <mj-title>${title}</mj-title>
            <mj-style>
            .curved {
                border-radius: 15px;
                border: 2px solid #24382e;
                -webkit-box-shadow: 2px 12px 0px 5px #E9A750;
                box-shadow: 6px 12px 0px 1px #E9A750;
            }

            .card-pad {
                padding: 75px 20px 200px 20px;
            }

            .header-text-c, .header-text-c div, .header-text-c[style], .header-text-c div[style] {
                font-size:52px !important;
                text-align: center !important;
                margin-bottom: 10px;
                font-family: "Serif" !important;
                font-weight: 700 !important;
                color: #24382E !important;
            }

            .body-text-c, .body-text-c div, .body-text-c[style], .body-text-c div[style] {
                color: #24382E !important;
            }

            @media (prefers-color-scheme: dark) {
                .body-text-c, .body-text-c div, .body-text-c[style], .body-text-c div[style], .header-text-c, .header-text-c div, .header-text-c[style], .header-text-c div[style] {
                    color: #24382E !important;
                }
            }

            @media only screen and (max-width: 600px) {
                .header-text-c, .header-text-c div, .header-text-c[style], .header-text-c div[style] {
                    font-size:40px !important;
                    text-align: center !important;
                    margin-bottom: 10px;
                }


                .card-pad {
                    padding: 90px 5px 200px 5px !important;
                }

                .background-img-under, .background-img-under[style] {
                    background:url(https://cdn.limelightapp.com/assets/email-bg-mobile.png) center top !important;
                }

            }
            </mj-style>
            <mj-attributes>
            <mj-all color="#24382E" />
            <mj-class name="bg-green" background-color="#24382E" />
            <mj-class name="bg-white" background-color="#FFF5EB" />
            <mj-class name="bg-orange" background-color="#eec69f" />
            <mj-class name="text-white" color="#fff" />
            <mj-class name="text-green" color="#24382E" />
            <mj-class name="border-orange" border-color="#E9A750" />
            <mj-class name="card" background-color="#eec69f" border-radius="15px" padding="10px" text-align="center" />
            <mj-class name="header-text" css-class="header-text-c" align="center" font-family="Serif" font-weight="bold" font-size="40px" />
            <mj-class name="body-text" align="center" font-family="Serif" font-weight="bold" font-size="16px" css-class="body-text-c" />

            </mj-attributes>
        </mj-head>
        <mj-body mj-class="text-white" background-color="#eec69f">
            <mj-wrapper background-url="https://cdn.limelightapp.com/assets/email-bg-desktop.png" full-width="full-width" background-size="cover" background-repeat="no-repeat" text-align="center" css-class="background-img-under">
            <mj-section css-class="card-pad">
                <mj-column mj-class="card text-green" css-class="curved">
                ${body}
                </mj-column>
            </mj-section>
            </mj-wrapper>
        </mj-body>
    </mjml>
   `;

	/**
	 * Render the set email body with the given parameters
	 * @param user User or users to send to
	 * @param parameters Email parameters passed to render function
	 */
	constructor(user: User | User[], parameters: T) {
		const renderedTemplate = this.render(this.template, parameters);
		const { html } = this.complile(renderedTemplate);

		if (!html) throw new Error('Unable to compile email to HTML');

		this.to = user;
		this.emailBody = html;
	}

	/**
	 * Render an email template using Mustache
	 * @description Use this to override the default email template
	 * @param body Email body. Inserted into the default template if `custom` is not `true`.
	 * @param parameters Parameters passed to Mustache
	 * @param custom Disable the default email template
	 * @returns Rendered email
	 */
	protected render<T extends Record<string, any>>(
		body: string,
		parameters: T,
		custom = false,
	) {
		let template = body;
		if (!custom) template = this.buildTemplate(this.subject, body);

		return mustache.render(template, parameters);
	}

	/**
	 * Compile MJMLto HTML
	 * @description Use this to skip the Mustache rendering and default template
	 * @param template MJML email
	 * @returns Compiled HTML email
	 */
	protected complile(template: string) {
		return mjml2html(template);
	}
}
