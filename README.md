# Discord Music Bot

Play music on your discord server from hundreds of sources!

> While I find a fancy name for this bot, I guess I’ll keep referring to it as ‘Discord Music Bot’. Suggestions are welcome!

This music bot is powered by youtube-dl, meaning it can typically play media [from hundreds of sources](http://ytdl-org.github.io/youtube-dl/supportedsites.html) in a Discord voice channel.

## Purpose

When somebody on my college’s Discord server proposed we add a music bot to the server for *funsies*, I took it up as a challenge to create a music bot of my own\*. Just a few weeks prior to this, I had created a [bot](https://github.com/amalbansode/Minecraft-Discord-Bot) to check the status of our Minecraft servers, so I assumed it wouldn’t be too hard to create this. After navigating through numerous “broken” dependencies and funky Node.js tricks, I had an initial application ready. I decided to further develop the application to create *a no-bullshit, easy to setup, and versatile* music bot for Discord servers.

*\* I must mention that I was on a 3-month long summer break during which I was primarily lazing around and honing my programming.*

## Installation
This bot requires Node.js to be installed on your system, along with several dependencies which are included in the `node_modules` folder.

### Setting up for use with Node.js
1. Install Node.js and npm on your system. (You can use [nvm](https://github.com/nvm-sh/nvm) or the [Node.js](https://nodejs.org/en/download/) binary.)
2. Clone this repository and place it in a folder. (Use `git clone https://github.com/amalbansode/Discord-Music-Bot.git` or download this repo as a .zip file and extract it.)
3. In terminal, navigate to this folder.
	```bash
	$ cd location/of/your/Discord-Bot
	```

### Setting up a Discord Application
1. [Create a Discord Application](https://discordapp.com/developers/applications/) for the purpose of this bot. Setup a Discord account if you do not have one yet.
2. Give the application a name and description. You can configure more details for your bot here if you would like.
3. Navigate to the ‘Bot’ section. Reveal your bot’s token, and copy it.
4. Open `config.json`, which is contained in the same folder as `bot.js`.
5. Paste your token within the double quotes corresponding to the "token" key, and save `config.json`.
6. Open `bot.js`, and on th elast line of the file, replace `process.env.TOKEN` with `token` and save `bot.js`.
7. Now, with Terminal open in the same directory as before, run
	```bash
	$ node bot.js
	```
8. The output should say the following. If so, you have setup the bot correctly.
	```
	Logged in as <your bot’s discord tag>!
	Ready...
	```
9. Exit the application using a keyboard escape (typically `control/command + C`).

### Adding the bot to a server
1. On the [Dicord Chat Client](https://discordapp.com/channels/), click the '+' icon on the left side and create a new server for testing the bot. Skip this step if you manage a pre-existing server you want the bot to be added to.
2. On the Discord Develper Portal for your bot, navigate to the section titled ‘OAuth2’. Scroll down to view the OAuth2 URL Generator.
3. Check the following boxes: 
	* In Scopes, _bot_
	* In Text Permissions under Bot Permissions, _Send Messages_, _Manage Messages_, and _Read Message History_
	* In Voice Permissions under Bot Permissions, _Connect_ and _Speak_
4. A URL must have been generated above. Follow this URL in a new browser tab.
5. Specify the server you would like to add the bot to (this could be the one you created in step 1, or a pre-existing server).
6. Verify the permissions stated, and click ‘Authorize’.
7. The bot should now be a member of your specified server.
8. Start the bot in Terminal again
	```bash
	$ node bot.js
	```
9. In the Discord chat window for this server, join a voice channel and test the various commands to verify that everything works correctly.

## Features
The bot can stream audio from numerous sources, but is primarily intended to stream from YouTube. At the moment, you can:

- [X] Play audio from a YouTube or Soundcloud video (playlist support coming soon!): `~play <URL>`
- [X] Pause and resume the audio stream: `pause` and `resume`
- [X] Create a queue of songs (supports different sources) and navigate within the queue: `~queue` and `~skipto`
- [X] Search YouTube and play the most relevant result for the query: `~search <query which can include spaces>`
- [X] Stop playback completely: `~stop`

## Roadmap
I aim to add the following features over the next few versions:

- [ ] Integration for reading media on Spotify and Apple Music, but unlikely given API restrictions.
- [ ] Playlist support on YouTube, SoundCloud, etc.
- [ ] Add permissions support, possibly. However, this is contentious given that I want this bot to be as simple as possible. Perhaps we should side with a democratic procedure here and let anybody control the bot :)

## FAQs
**Does the bot run forever?**

No, the bot goes offline when you close Terminal or end the process on your system. You could host the bot on AWS or Heroku, following the same steps as above, instead. The bot can be kept online using the _forever_ module. Check out [this guide](https://shiffman.net/a2z/bot-ec2/) on the usage of AWS.

## License
MIT License 

© Amal Bansode, 2019