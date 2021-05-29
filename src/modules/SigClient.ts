import * as discordjs from 'discord.js';

export class SigClient {
    client: discordjs.Client;
    owner: string;
    commands: Array<discordjs.ApplicationCommandData>;
    registeredGuildCommands: Array<String>;
    registeredGlobalCommands: Object;

    constructor(packageInfo: Object, owner: string) {
        this.owner = owner;
        this.commands = [];
        this.registeredGuildCommands = [];
        this.registeredGlobalCommands = {};
        this.client = new discordjs.Client({
            intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES']
        });

        this.client.on('message', message => {
            if (message.author.bot) return false;
            
            if (message.mentions.has(this.client.user, {ignoreRoles: true, ignoreEveryone: true})) {
                message.reply("Hi! I only respond to slash commands. You can see a list by typing `/` and clicking the Sig icon!");
            }

            if (message.author.id == this.owner && message.content.toLowerCase().includes("deploy test commands")) {
                message.reply("Hello, " + message.author.tag + ". Deploying guild commands!");
                if (!this.registeredGuildCommands[message.guild.id]) {
                    this.registeredGuildCommands[message.guild.id] = [];
                }
                let reply: string = "```\n";
                this.commands.forEach(async (command, index) => {
                    if (!this.registeredGuildCommands[message.guild.id].includes(command.name)) {
                        let registeredCommand = await message.guild.commands.create(command)
                            .catch((error) => console.error(error));
                        this.registeredGuildCommands[message.guild.id].push(command.name);
                    } else {
                        reply.concat(`Command ${command.name} is already registered for guild ${message.guild.id}`);
                    }
                });
                reply += "```";
                if (reply == "```\n```") {
                    reply = "```\nNo duplicates occured while deploying\n```"
                } // TODO: this doesnt really work. fix it later lol i guess
                message.channel.send(reply);
            }
        });
    }

    login(token: string) {
        return this.client.login(token);
    }
};
