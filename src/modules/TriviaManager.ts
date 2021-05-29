import { Snowflake } from 'discord-api-types';
import * as discordjs from 'discord.js';
import * as fs from 'fs';
import * as lodash from 'lodash';

interface TriviaQuestion {
    question: string;
    explanation: string;
    correct: string;
    incorrect: Array<string>;
}

interface RunningTriviaInfo {
    triviaQuestion: TriviaQuestion;
    orderedAnswers: Array<string>;
    correctAnswerIndex: number;
    replyId: discordjs.Snowflake;
    userPlaying: discordjs.Snowflake;
}

class TriviaManager {
    runningTrivias: Array<RunningTriviaInfo>;
    questions: Array<TriviaQuestion>

    constructor() { 
        this.runningTrivias = [];

        let buffer: Buffer;
        buffer = fs.readFileSync('./local/trivia.json');
        this.questions = JSON.parse(buffer.toString()) as Array<TriviaQuestion>;
        buffer = void 0;
    }

    getTriviaInfo(replyId: Snowflake): RunningTriviaInfo {
        return this.runningTrivias.find((trivia: RunningTriviaInfo) => trivia.replyId === replyId);
    }

    async startTrivia(interaction: discordjs.CommandInteraction): Promise<RunningTriviaInfo> {
        let question = lodash.sampleSize(this.questions, 1)[0];
        let text: string = `__**Trivia**__\n${question.question}`;
        
        let orderedAnswers: Array<string> = Array.from(question.incorrect);
        orderedAnswers.push(question.correct);
        orderedAnswers = lodash.sampleSize(orderedAnswers, 4);
        
        let actionRow = new discordjs.MessageActionRow();
        let correctAnswerIndex: number;
        orderedAnswers.forEach((answer: string, index: number) => {
            let answerButton = new discordjs.MessageButton()
                .setStyle('PRIMARY')
                .setCustomID(`showcase_trivia_${index.toString()}`)
                .setLabel(answer);
            actionRow.addComponent(answerButton);
            if (answer === question.correct) correctAnswerIndex = index;
        });
        if (typeof correctAnswerIndex === 'undefined') throw new Error(`Trivia question "${question.question}" is invalid (correctAnswerIndex did not get set)`);
        
        await interaction.reply(text, { components: [actionRow] })
            .catch((error) => { throw error; });
        
        let reply = await interaction.fetchReply() as discordjs.Message;
        this.runningTrivias.push({
            triviaQuestion: question,
            orderedAnswers,
            correctAnswerIndex,
            replyId: reply.id as Snowflake, // TODO: remove cast when the djs people fix it
            userPlaying: interaction.user.id
        });
        
        return this.getTriviaInfo(reply.id as Snowflake);
    }

    async answerTrivia(interaction: discordjs.MessageComponentInteraction): Promise<void> {
        let reply = interaction.message;
        let triviaInfo = this.getTriviaInfo(reply.id as Snowflake); // TODO: remove cast when the djs people fix it
        
        if (typeof triviaInfo === 'undefined') {
            interaction.reply(`Sorry, the trivia you tried to answer doesn't exist. (did you already answer it?)\nYou can play again with \`/showcase trivia\``, { ephemeral: true })
                .catch((error) => console.error(error));
            return;
        }

        if (interaction.user.id !== triviaInfo.userPlaying) {
            interaction.reply(`Sorry, this trivia is being played by <@${triviaInfo.userPlaying.toString()}>!\nYou can play with \`/showcase trivia\``, { ephemeral: true })
                .catch((error) => console.error(error));
            return;
        }

        let won: boolean = true;
        let actionRow = new discordjs.MessageActionRow();
        triviaInfo.orderedAnswers.forEach((answer: string, index: number) => {
            let style: discordjs.MessageButtonStyle = 'PRIMARY';
            if (index === triviaInfo.correctAnswerIndex) style = 'SUCCESS';
            else if (interaction.customID === `showcase_trivia_${index.toString()}`) {
                style = 'DANGER';
                won = false;
            } else style = 'PRIMARY';
            let answerButton = new discordjs.MessageButton()
                .setStyle(style)
                .setCustomID(`showcase_trivia_${index.toString()}`)
                .setDisabled(true)
                .setLabel(answer);
            actionRow.addComponent(answerButton);
        });

        let wonText: string = won ? 'Answered correctly' : 'Answered incorrectly';
        let text: string = `__**Trivia (${wonText})**__\n${triviaInfo.triviaQuestion.question}\nThe answer was ${triviaInfo.triviaQuestion.correct}.\nExplanation: ${triviaInfo.triviaQuestion.explanation}`;

        interaction.update(text, { components: [ actionRow ] })
            .catch((error) => {throw error});
        this.runningTrivias.splice(this.runningTrivias.indexOf(triviaInfo), 1);
        return;
    }
}

export { TriviaQuestion, RunningTriviaInfo, TriviaManager };
