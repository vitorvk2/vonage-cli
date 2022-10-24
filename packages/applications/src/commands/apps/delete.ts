import AppCommand from '../../app_base.js';
import { ArgInput } from '@oclif/core/lib/interfaces';
import chalk from 'chalk';
import { CliUx } from '@oclif/core';
import prompts from 'prompts';

const { prompt } = prompts;
const cli = CliUx.ux;

export default class ApplicationsDelete extends AppCommand<
    typeof ApplicationsDelete.flags
> {
    static description = 'delete a Vonage application';

    static flags = {
        ...AppCommand.flags,
    };

    static examples = [
        `vonage apps:delete 00000000-0000-0000-0000-000000000000`,
        `vonage apps:delete`,
    ];

    static args: ArgInput = [{ name: 'appId', required: false }];

    setQuestions(list: any) {
        return list.map((application: any) => {
            return {
                title: `${application.name} | ${application.id}`,
                value: application.id,
            };
        });
    }

    async run() {
        // const flags = this.parsedFlags
        const args = this.parsedArgs!;

        if (!args.appId) {
            const appData = await this.allApplications;
            const appList = appData['_embedded'].applications;
            const response = await prompt([
                {
                    type: 'autocompleteMultiselect',
                    name: 'appId',
                    message: 'Your Applications',
                    choices: this.setQuestions(appList),
                    initial: 0,
                },
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Confirm deletion?`,
                    initial: false,
                },
            ]);
            if (response.confirm) {
                delete response.confirm;
                const plural = response.appId.length > 1 ? 's' : '';
                cli.action.start(
                    chalk.bold(
                        `Deleting ${response.appId.length} Application${plural}`,
                    ),
                    'Initializing',
                    { stdout: true },
                );

                response.appId.map((v: any) => {
                    this.deleteApplication(v);
                    this.log(`Application ${v} deleted.`);
                });

                cli.action.stop();
            } else {
                this.log(chalk.bold('Delete cancelled.'));
            }
        }

        if (args.appId) {
            this.deleteApplication(args.appId);
            this.log(`Application ${args.appId} deleted.`);
        }

        this.exit();
    }

    async catch(error: any) {
        return super.catch(error);
    }
}
