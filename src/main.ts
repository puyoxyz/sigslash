import * as discordjs from 'discord.js';
import { table } from 'table';
import * as figlet from 'figlet';
import * as lodash from 'lodash';
import * as fs from 'fs';
import { SigClient } from './modules/SigClient';
import { TriviaManager } from './modules/TriviaManager';

let buffer: Buffer;
buffer = fs.readFileSync('./local/config.json');
let config = JSON.parse(buffer.toString());
buffer = fs.readFileSync('./package.json');
let packageInfo = JSON.parse(buffer.toString());
buffer = fs.readFileSync('./local/trivia.json');
let triviaQuestions = JSON.parse(buffer.toString());
buffer = undefined;


const sig = new SigClient(packageInfo, config.owner);
const triviaManager = new TriviaManager();
//let runningTrivias: Array<Object> = [];
//let runningPolls: Array<Object> = [];

// SET UP DATABASE HERE

sig.client.once('ready', async () => {
    sig.client.user.setActivity(config.activity.text, {type: config.activity.type}) // Setting the activity
    console.log("I WOULD LOG THAT WE CHANGED THE PRESENCE HERE BUT APPARENTLY PROMISES ARE CRINGE NOW!!!!! THANKS DJS");
    
    // Logging basic info
    console.log(figlet.textSync(packageInfo.name));
    console.log(packageInfo.description);
    console.log(table([
        ['Account', sig.client.user.tag],
        ['Activity', `${config.activity.type} ${config.activity.text}`],
        ['Help (Default)', `Slash command menu`],
        [`${packageInfo.name} info`, `${packageInfo.name} version ${packageInfo.version}\n${packageInfo.license}\nCopyright ${packageInfo.author} (c) 2021`]
    ]));
});

sig.login(config.token);
sig.commands.push({
    name: 'ping',
    description: 'Test command'
});
sig.commands.push({
    name: 'showcase',
    description: 'Showcases of new bot API features (specifically Interactions)',
    options: [
        {
            name: 'trivia',
            type: 'SUB_COMMAND',
            description: 'Random quiz/trivia using MessageButtons'
        },
        {
            name: 'ephemeral',
            type: 'SUB_COMMAND',
            description: 'Sends a message that only you can see'
        },
        {
            name: 'poll',
            type: 'SUB_COMMAND',
            description: 'Makes a poll with buttons that people can vote on (2-4 choices) which ends in 10 minutes',
            options: [
                {
                    name: 'first_option',
                    type: 'STRING',
                    description: 'Poll option',
                    required: true
                },
                {
                    name: 'second_option',
                    type: 'STRING',
                    description: 'Poll option',
                    required: true
                },
                {
                    name: 'third_option',
                    type: 'STRING',
                    description: 'Poll option'
                },
                {
                    name: 'fourth_option',
                    type: 'STRING',
                    description: 'Poll option'
                }
            ]
        }
    ]
})

sig.client.on('interaction', async (interaction: discordjs.Interaction) => {
    if (interaction.isCommand()) {
        let commandInteraction = interaction as discordjs.CommandInteraction;
        switch(commandInteraction.commandName) {
            case 'ping':
                let dripButton = new discordjs.MessageButton()
                    .setLabel('DRIP')
                    .setStyle('LINK')
                    .setURL('https://drip-car.me');
                let actionRow = new discordjs.MessageActionRow()
                    .addComponent(dripButton)
                    .addComponent(dripButton)
                    .addComponent(dripButton)
                    .addComponent(dripButton)
                    .addComponent(dripButton);
                await commandInteraction.reply('Pong! Client ping: ' + sig.client.ws.ping + 'ms', { components: [actionRow] })
                    .catch(error => console.error(error));
                break;
            case 'showcase':
                //commandInteraction.defer();
                if (commandInteraction.options.find(option => option.name == 'ephemeral')) {
                    await commandInteraction.reply('I was hula hooping. Kevin and I attend a class for fitness and for fun.\nI\'ve mastered all the moves: the pizza toss, the tornado, the scorpion, the oopsie-doodle.\nBut because this is an ephemeral message, noone will ever believe you.\nhttps://image-host.club/QgxfaXOz.png', {
                        ephemeral: true
                    })
                        .catch(error => console.error(error));
                } else if (commandInteraction.options.find(option => option.name == 'trivia')) {
                    triviaManager.startTrivia(interaction as discordjs.CommandInteraction);
                } else if (commandInteraction.options.find(option => option.name == 'poll')) {
                    await commandInteraction.reply('This command is a placeholder and doesn\'t exist yet')
                        .catch(error => console.error(error));
                } else {
                    await commandInteraction.reply('Well, this is awkward. That showcase doesn\'t seem to exist. If this issue persists, send an email to sig@puyo.xyz')
                        .catch(error => console.error(error));
                }
                break;
            default:
                await commandInteraction.reply('Well, this is awkward. You seem to have ran a command that... doesn\'t exist? If this issue persists, send an email to sig@puyo.xyz')
                    .catch(error => console.error(error));
                break;
        }
    } else if (interaction.isMessageComponent()) {
        let componentInteraction = interaction as discordjs.MessageComponentInteraction;
        if (componentInteraction.customID.includes('showcase_trivia')) {
            triviaManager.answerTrivia(interaction as discordjs.MessageComponentInteraction);
        }
    } else {
        console.log("unknown interaction: " + interaction);
        console.log(interaction.type);
    }
});
