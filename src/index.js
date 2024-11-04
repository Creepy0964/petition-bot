import { Telegraf } from "telegraf";
import Database from "better-sqlite3";
import Randomstring from "randomstring";

const bot = new Telegraf(process.env.TOKEN);
const db = new Database(process.env.DB);

bot.on('inline_query', async (ctx) => {
    const petition = db.prepare(`SELECT * FROM petitions WHERE query = '${ctx.inlineQuery.query}' AND author = '${ctx.inlineQuery.from.id}'`).get();
    if(ctx.inlineQuery.query != '') {
        if(petition) {
            await ctx.answerInlineQuery([{type: 'article', id: petition.id, title: petition.query, description: 'Отправить петицию заново', input_message_content: { message_text: `Автор петиции: ${ctx.from.username ? ctx.from.username : ctx.from.id}\nПредложение: ${petition.query}` }, reply_markup: { inline_keyboard: [ [ {text: `За: ${petition.for}`, callback_data: `${petition.id}_vote_for`}, {text: `Против: ${petition.against}`, callback_data: `${petition.id}_vote_against`} ] ] } } ])
        }
        else {
            let id = `petition_${Randomstring.generate(8)}`;
            await ctx.answerInlineQuery([{ type: 'article', id: `${id}`, title: 'Создать петицию', description: 'Введите текст Вашей петиции', input_message_content: { message_text: `Автор петиции: ${ctx.from.username ? ctx.from.username : ctx.from.id}\nПредложение: ${ctx.inlineQuery.query}` }, reply_markup: { inline_keyboard: [ [ {text: `За: 0`, callback_data: `${id}_vote_for`}, {text: `Против: 0`, callback_data: `${id}_vote_against`} ] ] } } ]);
        }
    }
});

bot.on('chosen_inline_result', async (ctx) => {
    const petition = db.prepare(`SELECT * FROM petitions WHERE id = '${ctx.chosenInlineResult.result_id}'`).get();
    if(!petition) {
        db.prepare(`INSERT INTO petitions (id, query, author, for, against, username) VALUES ('${ctx.chosenInlineResult.result_id}', '${ctx.chosenInlineResult.query}', ${ctx.chosenInlineResult.from.id}, 0, 0, '${ctx.chosenInlineResult.from.username ? ctx.chosenInlineResult.from.username : undefined}')`).run();
        console.log(`${ctx.chosenInlineResult.from.id} created ${ctx.chosenInlineResult.result_id}`);
    }    
});

bot.on('callback_query', async (ctx) => {
    const petition = db.prepare(`SELECT * FROM petitions WHERE id = '${ctx.callbackQuery.data.slice(0, 17)}'`).get();
    const vote = db.prepare(`SELECT * FROM votes WHERE user = '${ctx.callbackQuery.from.id}' AND petition = '${ctx.callbackQuery.data.slice(0, 17)}'`).get();
    const action = ctx.callbackQuery.data;

    if(!petition) {
        console.log(`no such petition`);
        return;
    }

    if(vote) {
        try {
            await ctx.editMessageText(`Автор петиции: ${petition.username != 'undefined' ? petition.username : petition.author}\nПредложение: ${petition.query}`, {reply_markup: {inline_keyboard: [[
                {text: `За: ${petition.for}`, callback_data: `${ctx.callbackQuery.data.slice(0, 17)}_vote_for`},
                {text: `Против: ${petition.against}`, callback_data: `${ctx.callbackQuery.data.slice(0, 17)}_vote_against`}
            ]]}});
        }
        catch {
            console.log(`${ctx.callbackQuery.from.id} already voted at ${ctx.callbackQuery.data.slice(0, 17)}`);
        }
    }
    else {
        db.prepare(`INSERT INTO votes (user, petition) VALUES (${ctx.callbackQuery.from.id}, '${ctx.callbackQuery.data.slice(0, 17)}')`).run();

        if(action.includes('vote_for')) {
            db.prepare(`UPDATE petitions SET for = for + 1 WHERE id = '${ctx.callbackQuery.data.slice(0, 17)}'`).run();
            console.log(`${ctx.callbackQuery.from.id} voted for at ${ctx.callbackQuery.data.slice(0, 17)}`);
        }
        else if(action.includes('vote_against')) {
            db.prepare(`UPDATE petitions SET against = against + 1 WHERE id = '${ctx.callbackQuery.data.slice(0, 17)}'`).run();
            console.log(`${ctx.callbackQuery.from.id} voted against at ${ctx.callbackQuery.data.slice(0, 17)}`);
        }

        const petitionNew = db.prepare(`SELECT * FROM petitions WHERE id = '${ctx.callbackQuery.data.slice(0, 17)}'`).get();

        if(!petitionNew) {
            console.log(`no such petition`);
            return;
        }
    
        await ctx.editMessageText(`Автор петиции: ${petitionNew.username != 'undefined' ? petitionNew.username : petitionNew.author}\nПредложение: ${petitionNew.query}`, {reply_markup: {inline_keyboard: [[
            {text: `За: ${petitionNew.for}`, callback_data: `${ctx.callbackQuery.data.slice(0, 17)}_vote_for`},
            {text: `Против: ${petitionNew.against}`, callback_data: `${ctx.callbackQuery.data.slice(0, 17)}_vote_against`}
        ]]}});
    }
});

bot.launch();

process.once('SIGTERM', () => { bot.stop('SIGTERM') });
process.once('SIGINT', () => { bot.stop('SIGINT') });