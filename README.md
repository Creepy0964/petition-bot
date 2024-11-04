# petition-bot
a simple anonymous voting inline bot for telegram

## there are already anonymous polls on telegram. why?
because i can

## code is a piece of unreadable shit
i know. did it on purpose

## how to launch

first things first:
```bash
git clone https://github.com/creepy0964/petition-bot
cd petition-bot
```

### the basic way
create `src/.env` file and pass TOKEN and DB variables in it:
```bash
TOKEN=your_bot_token
DB=../db/database.db
```

then, make sure `package.json` is present and if yes, execute this:
```bash
npm start
```

if not, `npm install telegraf better-sqlite3 randomstring .` and then launch with `node --env-file=src/.env src/index.js`

### the cool docker-compose way to fuck around as if you were cool developer
uhhh... just execute `docker-compose up -d --build`? idk what else i could say here :p
btw be sure that `package.json` is in ./src if you are using this method

## special thanks to
all folks that helped me to test and debug this piece of shit. licensed with WTFPL so do whatever you want cuz i dont give an actual fuck