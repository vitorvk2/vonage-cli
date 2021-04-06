import { AppCommand } from '@vonage/cli-utils';
import { OutputFlags } from '@oclif/parser';
import { flags } from '@oclif/command'
import { prompt } from 'prompts'
import { webhookQuestions } from '../../helpers'
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator'
import { merge } from 'lodash';
import * as fs from 'fs';
import cli from 'cli-ux';
import chalk from 'chalk';
import ApplicationsShow from './show'

const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals], // colors can be omitted here as not used
    length: 2
});

interface CreateFlags {
    voice_answer_url: any,
    voice_answer_http: any,
    voice_event_url: any,
    voice_event_http: any,
    messages_inbound_url: any,
    messages_status_url: any,
    rtc_event_url: any,
    rtc_event_http: any,
    vbc: any
}

export default class ApplicationsCreate extends AppCommand {
    static description = 'create a new Vonage application'

    static examples = [
        'vonage app:create', 'vonage app:create APP_NAME --voice_answer_url=https://www.sample.com'
    ]

    static flags: OutputFlags<typeof AppCommand.flags> & CreateFlags = {
        ...AppCommand.flags,
        'voice_answer_url': flags.string({
            description: 'Voice Answer Webhook URL Address',
            parse: input => `{"voice": {"webhooks": {"answer_url": {"address": "${input}"}}}}`
        }),
        'voice_answer_http': flags.string({
            description: 'Voice Answer Webhook HTTP Method',
            options: ['GET', 'POST'],
            dependsOn: ['voice_answer_url'],
            parse: input => `{"voice": {"webhooks": {"answer_url": {"method": "${input}"}}}}`
        }),
        'voice_event_url': flags.string({
            description: 'Voice Event Webhook URL Address',
            parse: input => `{"voice": {"webhooks": {"event_url": {"address": "${input}"}}}}`
        }),
        'voice_event_http': flags.string({
            description: 'Voice Event Webhook HTTP Method',
            options: ['GET', 'POST'],
            dependsOn: ['voice_event_url'],
            parse: input => `{"voice": {"webhooks": {"event_url": {"method": "${input}"}}}}`
        }),
        'messages_inbound_url': flags.string({
            description: 'Messages Inbound Webhook URL Address',
            parse: input => `{"messages": {"webhooks": {"inbound_url": {"address": "${input}"}}}}`
        }),
        'messages_status_url': flags.string({
            description: 'Messages Status Webhook URL Address',
            parse: input => `{"messages": {"webhooks": {"status_url": {"address": "${input}"}}}}`
        }),
        'rtc_event_url': flags.string({
            description: 'RTC Event Webhook URL Address',
            parse: input => `{"rtc": {"webhooks": {"event_url": {"address": "${input}"}}}}`
        }),
        'rtc_event_http': flags.string({
            description: 'RTC Event Webhook HTTP Method',
            options: ['GET', 'POST'],
            dependsOn: ['rtc_event_url'],
            parse: input => `{"rtc": {"webhooks": {"event_url": {"method": "${input}"}}}}`
        }),
        'vbc': flags.boolean({
            description: 'VBC Capabilities Enabled',
        }),

    }

    static args = [
        ...AppCommand.args,
        { name: 'name', required: false }
    ]

    async run() {
        const flags = this.parsedFlags
        const args = this.parsedArgs!;
        let response: any = { name: '', capabilities: {} };

        if (!args.name && Object.keys(flags).length > 0) {
            this.error(new Error('Argument \'name\' not provided'))
        }

        if (args.name && Object.keys(flags).length >= 0) {

            let tobeAssigned = Object.keys(flags).map((value: string, index) => {
                return JSON.parse(flags[value])
            }, [])

            merge(response.capabilities, ...tobeAssigned)
            response.name = args.name;
        }

        // if no flags or arguments provided, make interactive
        if (!args.name && Object.keys(flags).length === 0) {

            let general = await prompt([
                {
                    type: 'text',
                    name: 'name',
                    message: `Application Name`,
                    initial: shortName
                }, {
                    type: 'multiselect',
                    name: 'selected_capabilities',
                    message: 'Select App Capabilities',
                    choices: [
                        { title: 'Voice', value: 'voice' },
                        { title: 'Messages', value: 'messages' },
                        { title: 'RTC', value: 'rtc' },
                        { title: 'VBC', value: 'vbc' }
                    ],
                    hint: '- Space to select. Return to submit'
                }
            ])
            response = Object.assign({}, response, general);

            if (response.selected_capabilities?.indexOf('voice') > -1) {
                response.capabilities.voice = {}
                let answer_url, event_url

                let voice = await prompt({
                    type: 'confirm',
                    name: 'voice_webhooks_confirm',
                    message: 'Create voice webhooks?'
                })

                if (voice.voice_webhooks_confirm) {
                    answer_url = await webhookQuestions({ name: 'Answer Webhook' })
                    event_url = await webhookQuestions({ name: 'Event Webhook' })
                } else {
                    answer_url = { address: "https://www.sample.com/webhook/answer_url" }
                    event_url = { address: "https://www.sample.com/webhook/event_url" }
                }

                response.capabilities.voice = { webhooks: { answer_url, event_url } }
            }

            if (response.selected_capabilities?.indexOf('messages') > -1) {
                response.capabilities.messages = {};
                let inbound_url, status_url
                let messages = await prompt({
                    type: 'confirm',
                    name: 'webhooks_confirm',
                    message: 'Create messages webhooks?'
                })

                if (messages.webhooks_confirm) {
                    inbound_url = await webhookQuestions({ name: 'Inbound Message Webhook' })
                    status_url = await webhookQuestions({ name: 'Status Webhook' })
                } else {
                    inbound_url = { address: "https://www.sample.com/webhook/inbound_url" }
                    status_url = { address: "https://www.sample.com/webhook/status_url" }
                }
                response.capabilities.messages = { webhooks: { status_url, inbound_url } }

            }

            if (response.selected_capabilities?.indexOf('rtc') > -1) {
                response.capabilities.rtc = {};
                let event_url

                let rtc = await prompt({
                    type: 'confirm',
                    name: 'webhooks_confirm',
                    message: 'Create RTC webhook?'
                })

                if (rtc.webhooks_confirm) {
                    let event_url = await webhookQuestions({ name: 'Event Webhook' })
                    response.capabilities.rtc = { webhooks: { event_url } }
                } else {
                    event_url = { address: "https://www.sample.com/webhook/rtc_event_url" }
                }

                response.capabilities.rtc = { webhooks: { event_url } }
            }

            if (response.selected_capabilities?.indexOf('vbc') > -1) {
                response.capabilities.vbc = {}
            }

            delete response.selected_capabilities

        }

        cli.action.start(chalk.bold('Creating Application'), 'Initializing', { stdout: true })

        // create application
        let output = await this.createApplication(response)
        fs.writeFileSync(`${process.cwd()}/${output.name}_private.key`, output.keys.private_key)
        cli.action.stop()


        let indent = '  '

        this.log(chalk.magenta.underline.bold("Application Name:"), output.name)
        this.log('')
        this.log(chalk.magenta.underline.bold("Application ID:"), output.id)
        this.log('')

        let { voice, messages, rtc, vbc } = output.capabilities

        if (voice) {
            let { event_url, answer_url } = voice.webhooks

            this.log(chalk.magenta.underline.bold("Voice Settings"))

            this.log(indent, chalk.cyan.underline.bold("Event Webhook:"))
            this.log(indent, indent, chalk.bold('Address:'), event_url.address)
            this.log(indent, indent, chalk.bold('HTTP Method:'), event_url.http_method)

            this.log(indent, chalk.cyan.underline.bold("Answer Webhook:"))
            this.log(indent, indent, chalk.bold('Address:'), answer_url.address)
            this.log(indent, indent, chalk.bold('HTTP Method:'), answer_url.http_method)
            this.log('')
        }

        if (messages) {
            let { inbound_url, status_url } = messages.webhooks

            this.log(chalk.magenta.underline.bold("Messages Settings"))

            this.log(indent, chalk.cyan.underline.bold("Inbound Webhook:"))
            this.log(indent, indent, chalk.bold('Address:'), inbound_url.address)
            this.log(indent, indent, chalk.bold('HTTP Method:'), inbound_url.http_method)

            this.log(indent, chalk.cyan.underline.bold("Status Webhook:"))
            this.log(indent, indent, chalk.bold('Address:'), status_url.address)
            this.log(indent, indent, chalk.bold('HTTP Method:'), status_url.http_method)
            this.log('')
        }

        if (rtc) {
            let { event_url } = rtc.webhooks
            this.log(chalk.magenta.underline.bold("RTC Settings"))

            this.log(indent, chalk.cyan.underline.bold("Event Webhook:"))
            this.log(indent, indent, chalk.bold('Address:'), event_url.address)
            this.log(indent, indent, chalk.bold('HTTP Method:'), event_url.http_method)
            this.log('')
        }

        if (vbc) {
            this.log(chalk.magenta.underline.bold("VBC Settings"))
            this.log(chalk.bold("Enabled"))
            this.log('')
        }

        this.log(chalk.magenta.underline.bold("Public Key"))
        this.log(output.keys.public_key)
        this.log('')

        this.log(chalk.magenta.underline.bold("Private Key File"))
        this.log(`${process.cwd()}/${output.name}_private.key`)
        this.log('')

        this.exit();
    }

}
