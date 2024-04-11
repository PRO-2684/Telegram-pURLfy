const fs = require("node:fs");
const path = require("node:path");
const TelegramBot = require('node-telegram-bot-api');
const config = require("./config.json");
const Purlfy = require("./purlfy");

const rulesPath = "./rules";
const log = (...args) => {
    console.log(`[${(new Date()).toLocaleTimeString()}]`, ...args);
}

// pURLfy init
const purifier = new Purlfy({
    lambdaEnabled: true,
    redirectEnabled: true
});
for (const rulesFile of fs.readdirSync(rulesPath)) {
    const content = fs.readFileSync(path.join(rulesPath, rulesFile));
    try {
        const rules = JSON.parse(content);
        purifier.importRules(rules);
    } catch (e) {
        log(`Error loading ${rulesFile}: ${e}`);
    }
}

// Telegram bot
const bot = new TelegramBot(config.token, {
    polling: true, filepath: false, request: {
        agentOptions: { // Force ipv4
            keepAlive: true,
            family: 4
        }
    }
});

bot.on('polling_error', (error) => {
    console.error(error);
});

bot.on('text', async (msg) => {
    log("Received text message:", msg);
    const first = msg.entities?.[0] ?? msg.text;
    if (first.type === "bot_command") {
        const command = msg.text.slice(first.offset, first.offset + first.length);
        log("Command:", command);
        const handler = map[command] ?? handleFallback;
        handler(msg);
    } else {
        handlePurify(msg); // Default to purify URLs
    }
});

// Logics
const map = {
    "/start": handleStart,
    "/help": handleStart,
    "/purify": handlePurify
};

async function handleFallback(msg) {
    bot.sendMessage(msg.chat.id, "😣 I cannot understand your command. Try using /help for a list of commands.", { "reply_parameters": { "message_id": msg.message_id } });
}

async function handleStart(msg) {
    bot.sendMessage(msg.chat.id, "😘 Hello, I can help you to purify your links\\. Simply send them to me or reply to the message containing the links with command /purify\\.\n🫣 However, do note that your messages might be logged, so **DO NOT share sensitive links** with me\\.", {
        "parse_mode": "MarkdownV2",
        "reply_parameters": { "message_id": msg.message_id }
    });
}

async function handlePurify(msg) {
    try {
        const chatId = msg.chat.id;
        let urls = extractUrls(msg);
        if (msg.reply_to_message) {
            const replyUrls = extractUrls(msg.reply_to_message);
            urls = replyUrls.concat(urls);
        }
        const charsBefore = purifier.getStatistics().char;
        const purified = await purifyUrls(urls);
        const charsAfter = purifier.getStatistics().char;
        let result = "";
        if (urls.length > 0) {
            for (let i = 0; i < urls.length; i++) {
                result += `\\- [original](${tgEscapeUrl(urls[i])}) \\-\\> [purified](${tgEscapeUrl(purified[i].url)}), rule "${tgEscape(purified[i].rule)}"\n`;
            }
            result += `🧹 Purified ${formatWord(urls.length, "url")}, removed ${formatWord(charsAfter - charsBefore, "character")}, hooray 🎉`;
        } else {
            result = "🫥 No links found\\.";
        }
        // send a message to the chat acknowledging receipt of their message
        log("Reply:", result);
        bot.sendMessage(chatId, result, {
            "parse_mode": "MarkdownV2",
            "link_preview_options": { "is_disabled": true },
            "reply_parameters": { "message_id": msg.message_id }
        });
    } catch (e) {
        console.error(e);
        bot.sendMessage(chatId, "🥺 An error occured while processing your request.", {
            "reply_parameters": { "message_id": msg.message_id }
        });
    }
}

function formatWord(cnt, word) {
    if (Math.abs(cnt) <= 1) {
        return `${cnt} ${word}`;
    } else {
        return `${cnt} ${word}s`;
    }
}

function tgEscapeUrl(url) {
    const toEscape = ["\\", ")"];
    let result = "";
    for (const c of url) {
        if (toEscape.includes(c)) {
            result += "\\";
        }
        result += c;
    }
    return result;
}

function tgEscape(text) {
    const toEscape = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    let result = "";
    for (const c of text) {
        if (toEscape.includes(c)) {
            result += "\\";
        }
        result += c;
    }
    return result;
}

function extractUrls(msg) {
    const text = msg.text;
    if (!text) return [];
    const urls = [];
    for (const entity of (msg.entities ?? [])) {
        if (entity.type === "url") {
            const end = entity.offset + entity.length;
            const url = text.slice(entity.offset, end);
            log(`Parsed URL: [${entity.offset}, ${end}) ${url}`);
            urls.push(url);
        } else if (entity.type === "text_link") {
            urls.push(entity.url);
        }
    }
    return urls;
}

async function purifyUrls(urls) {
    const promises = urls.map((url) => purifier.purify(url));
    return Promise.all(promises);
}

log("Bot started.")
