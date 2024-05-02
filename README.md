# Telegram-pURLfy

A Telegram bot to purify your links, based on [pURLfy core](https://github.com/PRO-2684/pURLfy). You can find the bot at [@purlfy_bot](https://t.me/purlfy_bot).

## Deploying

> Note that **NodeJS 18+** is required. If you're using a lower version, you can try to remove `node:` from the first two lines at `index.js`, but I do not promise this solution will work.

1. Clone the repo
2. Install dependencies with `npm install --save node-telegram-bot-api`
3. Get `purlfy.js` and `rules/` at [pURLfy core](https://github.com/PRO-2684/pURLfy/) and [pURLfy rules](https://github.com/PRO-2684/pURLfy-rules/) (You can try out `update.sh` if you're lazy)
4. Create `config.json` with following key(s):
    - `token`: Your bot token, **required**
    - Todo...
5. `node index.js`
