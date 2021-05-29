import * as discordjs from 'discord.js';
import { table } from 'table';
import * as figlet from 'figlet';
import * as lodash from 'lodash';
import * as fs from 'fs';
let buffer: Buffer;
buffer = fs.readFileSync('./local/config.json');
let config = JSON.parse(buffer.toString());
buffer = fs.readFileSync('./package.json');
let packageInfo = JSON.parse(buffer.toString());
buffer = fs.readFileSync('./local/trivia.json');
let triviaQuestions = JSON.parse(buffer.toString());
buffer = undefined;

import { SigClient } from './sigclient';

const sig = new SigClient(packageInfo, config.owner);
let runningTrivias: Array<Object> = [];
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
                    let questionObject = lodash.sampleSize(triviaQuestions, 1);
                    questionObject = questionObject[0];
                    let text: string = `__**Trivia**__\n${questionObject["question"]}`;
                    /*console.log(text);
                    console.log(questionObject["incorrect"]);
                    console.log(questionObject["correct"]);
                    console.log(questionObject);*/
                    let answers: Array<string> = Array.from(questionObject["incorrect"]);
                    answers.push(questionObject["correct"]);
                    answers = lodash.sampleSize(answers, 4);
                    let actionRow = new discordjs.MessageActionRow();
                    let correctIndex: number;
                    answers.forEach((answer, index) => {
                        let answerButton = new discordjs.MessageButton()
                            .setStyle('PRIMARY')
                            .setCustomID(index.toString())
                            .setLabel(answer);
                        actionRow.addComponent(answerButton);
                        if (answer == questionObject["correct"]) {
                            correctIndex = index;
                        }
                    });
                    await commandInteraction.reply(text, {
                        components: [ actionRow ]
                    })
                        .catch(error => console.error(error));
                    let daReply = await commandInteraction.fetchReply() as discordjs.Message;
                    runningTrivias.push({
                        "questionObject": questionObject,
                        "answers": answers,
                        "correctIndex": correctIndex,
                        "reply": daReply.id,
                        "channel": daReply.channel.id,
                        "user": commandInteraction.user.id
                    });
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
        let reply = await componentInteraction.message;
        let triviaInfo = runningTrivias.find(t => t["reply"] == reply.id);
        if (componentInteraction.user.id != triviaInfo["user"]) {
            componentInteraction.reply("Sorry, this trivia isn't yours! You can play with `/showcase trivia`", { ephemeral: true });
            return;
        }
        let won: boolean = true;
        if (triviaInfo != undefined) {
            // add check for who pressed the button here
            let actionRow = new discordjs.MessageActionRow();
            triviaInfo["answers"].forEach((answer: string, index: number) => {
                let style: discordjs.MessageButtonStyle = 'PRIMARY';
                if (index == triviaInfo["correctIndex"]) {
                    style = 'SUCCESS';
                } else if (componentInteraction.customID == index.toString()) {
                    style = 'DANGER';
                    won = false;
                } else {
                    style = 'PRIMARY';
                }
                let answerButton = new discordjs.MessageButton()
                    .setStyle(style)
                    .setCustomID(index.toString())
                    .setDisabled(true)
                    .setLabel(answer);
                actionRow.addComponent(answerButton);
            });
            let wonText: string;
            if (won) {
                wonText = "Answered correctly";
            } else {
                wonText = "Answered incorrectly";
            }
            let text: string = `__**Trivia (${wonText})**__\n${triviaInfo["questionObject"]["question"]}\nThe answer was ${triviaInfo["questionObject"]["correct"]}.\nExplanation: ${triviaInfo["questionObject"]["explanation"]}`;
            componentInteraction.update(text, { components: [ actionRow ] })
                .catch(error => console.error(error));
            runningTrivias.splice(runningTrivias.indexOf(triviaInfo), 1);
        } else {
            console.log("Doesn't exist?");
            componentInteraction.reply("You seem to have answered a trivia that doesn't exist. Ooooops!", { ephemeral: true });
        }
    } else {
        console.log("unknown interaction: " + interaction);
        console.log(interaction.type);
    }
});
