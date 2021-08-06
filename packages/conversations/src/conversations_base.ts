import BaseCommand from '@vonage/cli-utils';
import { OutputFlags } from '@oclif/parser';


export default abstract class ConversationsCommand extends BaseCommand {
    static flags: OutputFlags<typeof BaseCommand.flags> = {
        ...BaseCommand.flags,
    };

    static args = [
        ...BaseCommand.args,
    ];

    async init(): Promise<void> {
        super.init();
        this.log('do conversation checks here')
        return;
    }

    getAllConversations(opts): Promise<any> { return opts }
    createConversation(opts): Promise<any> { return opts }
    getConversationById(id): Promise<any> { return id }
    updateConversation(opts): Promise<any> { return opts }
    deleteConversation(id): Promise<any> { return id }

    getConversationsByUser(opts): Promise<any> { return opts }

    getAllMembersInConversation(opts): Promise<any> { return opts }
    getMemberById(id): Promise<any> { return id }
    addMemberToConversation(opts): Promise<any> { return opts }
    removeMemberFromConversation(opts): Promise<any> { return opts }
}


// async init(): Promise<void> {
//     const { args, flags } = this.parse(this.constructor as Input<typeof BaseCommand.flags>);

//     this.globalFlags = { apiKey: flags.apiKey, apiSecret: flags.apiSecret, trace: flags.trace };
//     this.parsedArgs = args;
//     this.parsedFlags = flags;
//     this.Vonage = Vonage;
//     //this removes the global flags from the command, so checking for interactive mode is possible.
//     delete this.parsedFlags.apiKey
//     delete this.parsedFlags.apiSecret
//     delete this.parsedFlags.trace

//     this._userConfig = await fs.readJSON(path.join(this.config.configDir, 'vonage.config.json'))
//     let apiKey, apiSecret;

//     // creds priority order -- flags > env > config
//     if (flags?.apiKey && flags?.apiSecret) {
//         apiKey = flags.apiKey;
//         apiSecret = flags.apiSecret;
//     } else if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
//         apiKey = process.env.VONAGE_API_KEY;
//         apiSecret = process.env.VONAGE_API_SECRET;
//     } else {
//         apiKey = this._userConfig.apiKey;
//         apiSecret = this._userConfig.apiSecret;
//     }

//     this._apiKey = apiKey;
//     this._apiSecret = apiSecret;
// }
