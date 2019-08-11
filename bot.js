require('dotenv').config()

const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');

const ytSearch = require('yt-search')
var youtubedl = require('youtube-dl');
var fs = require('fs');

const client = new Discord.Client();

const queue = new Map();

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	console.log('Ready!');
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	const serverQueue = queue.get(message.guild.id);

	if (!!!message.member.voice.channel) {
		return message.reply('**You have to be in a voice channel to control music playback!**').then(message => {message.delete({timeout: 5000})}).catch();
	} else if (message.content.startsWith(`${prefix}help`)) {
		help(message);
		return;
	} else if (message.content.startsWith(`${prefix}play`)) {
		execute(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}next`)) {
		next(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}stop`) || message.content.startsWith(`${prefix}reset`)) {
		stop(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}queue`)) {
		displayQueue(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}skipto`)) {
		skipTo(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}pause`)) {
		pause(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}resume`)) {
		resume(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}search`)) {
		search(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}hail`)) {
        message.content = `${prefix}play https://www.youtube.com/watch?v=EF--ldYIBnM`;
		execute(message, serverQueue);
		return;
	} else {
		message.reply('**Invalid command**').then(message => {message.delete({timeout: 5000})}).catch();
	}

});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');

	const voiceChannel = message.member.voice.channel;
	const permissions = voiceChannel.speakable;
	if (!permissions) return message.channel.send('I need the permissions to join and speak in your voice channel!');

	let song = {
		title: '',
		url: '',
		source: '',
		duration: ''
	};

	// Check if fetching is possible
	try {
		let videoTest = youtubedl(
			args[1],
			['-i', '--no-warnings']);
	} catch (err) {
		console.log('Error encountered during test of ' + args[1]);
		return message.reply('**Unable to find media located at** ' + args[1]).then(message => {message.delete({timeout: 5000})}).catch();
	}
	const video = youtubedl(
		args[1], 
		['--format=bestaudio', '--user-agent', '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.50 Safari/537.36"', '-i', '--no-warnings'], 
		{});
	video.on('info', function(info) {
		song.title = info.title;
		song.url = args[1];
		song.source = info.url;
		song.duration = info.duration;
		console.log('Fetched details for ' + song.title);
		// console.log(info);
	});
	await new Promise(done => setTimeout(done, 5000));
	if (song.source == '') return message.reply('**Unable to find media located at** ' + args[1]).then(message => {message.delete({timeout: 5000})}).catch();

	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			videos: [],
			volume: 5,
			playing: true,
		};

		message.channel.send(`Queue initiated with ${song.title}! Duration: ${song.duration}`).then(message => {message.delete({timeout: 5000})}).catch();

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push(song);
		queueContruct.videos.push(video);

		try {
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			play(message.guild, queueContruct.songs[0], queueContruct.videos[0], message);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		serverQueue.videos.push(video);
		return message.reply(`${song.title} has been added to the queue! Duration: ${song.duration}`).then(message => {message.delete({timeout: 5000})}).catch();
	}

}

function help(message) {
	return message.reply(`Here's a short guide on using this Music Bot.

	To control the bot, you will need to join a voice channel on this Discord server.
	All commands that control this bot begin with a \`${prefix}\` character.
	This bot is designed to stream audio from numerous sources, but works best with YouTube. 

	Commands:
	- \`~play <URL>\` Play audio from a supported source
	- \`~pause\` Pause the audio stream
	- \`~resume\` Resume the audio stream
	- \`~queue\` Display the current queue of songs
	- \`~next\` Skip to the next song in the queue
	- \`~skipto <index number>\` Skip to a certain song in the queue, identified by its index number in the queue
	- \`~search <query which can include spaces>\` Search YouTube and play the most relevant result for the query
	- \`~stop\` Stop playback entirely, clears queue

	This message will delete itself within a minute. 
	Most messages from the bot, by default, also delete themselves after a few seconds to minimise junk in your messaging channels.
		`).then(message => {message.delete({timeout: 60000})}).catch();
}

function next(message, serverQueue) {
	if (!serverQueue) return message.reply('**Queue doesn\'t exist!**').then(message => {message.delete({timeout: 5000})}).catch();
	serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!serverQueue) return message.reply('**Queue doesn\'t exist!**').then(message => {message.delete({timeout: 5000})}).catch();
	try {
		serverQueue.songs = [];
		serverQueue.videos = [];
		serverQueue.connection.dispatcher.end();
	} catch (err) {
		console.log(err);
		return message.reply('**Unable to stop playback.**').then(message => {message.delete({timeout: 5000})}).catch();
	}
}

async function play(guild, song, video, message) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		console.log('Playback ended!');
		message.channel.send('Playback ended!').then(message => {message.delete({timeout: 5000})}).catch();
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

    client.user.setActivity(song.title);

    durationParts = song.duration.split(':');
    let rawDuration = 0;
    if (durationParts.length == 3) rawDuration = (Number(durationParts[0]) * 3600000) + (Number(durationParts[1]) * 60000) + (Number(durationParts[2]) * 1000);
    else if (durationParts.length == 2) rawDuration = (Number(durationParts[0]) * 60000) + (Number(durationParts[1]) * 1000);
    else if (durationParts.length == 1) rawDuration = (Number(durationParts[0]) * 1000);

	const writeStream = await video.pipe(fs.createWriteStream('yee.webm', {flags: 'w'}));
	await new Promise(done => setTimeout(done, 5000));

    message.channel.send(`Now playing ${song.title}`).then(message => {message.delete({timeout: (rawDuration+5000)/10})}).catch();
	let readStream = fs.createReadStream('yee.webm');
	const dispatcher = serverQueue.connection.play(readStream)
		.on('end', () => {
			console.log(`Song ${song.title} ended!`);
			writeStream.end();
			client.user.setActivity();
			serverQueue.songs.shift();
			serverQueue.videos.shift();
			play(guild, serverQueue.songs[0], serverQueue.videos[0], message);
		})
		.on('error', error => {
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

function pause(message, serverQueue) {
    if (!serverQueue) return message.reply('**Queue doesn\'t exist!**').then(message => {message.delete({timeout: 5000})}).catch();
    
    serverQueue.connection.dispatcher.pause();
}

function resume(message, serverQueue) {
    if (!serverQueue) return message.reply('**Queue doesn\'t exist!**').then(message => {message.delete({timeout: 5000})}).catch();
    
    serverQueue.connection.dispatcher.resume();
}

function displayQueue(message, serverQueue) {	
    if (!serverQueue) return message.reply('**Queue doesn\'t exist!**').then(message => {message.delete({timeout: 5000})}).catch();
	let queueStr = '';
    for (const song of Object.entries(serverQueue.songs)) {
		queueStr = `${queueStr}` + `[` + (parseInt(song[0]) + 1) + `] ${song[1].title}  Duration: ${song[1].duration}\n`;
	}
	message.channel.send(queueStr).then(message => {message.delete({timeout:serverQueue.songs.length * 4000})}).catch();
}

function skipTo(message, serverQueue) {
    const args = message.content.split(' ');

    if (isNaN(args[1])) return message.reply('**Unable to skip.** ~skipto **must be followed by a space, then the index number of the song in the queue that you would like to skip to.**').then(message => {message.delete({timeout: 6000})}).catch();
    
    try {
    	let count = 1;
    	serverQueue.connection.dispatcher.end();
	    while (count < Number(args[1])-1) {
			serverQueue.songs.shift();
			serverQueue.videos.shift();
			count++;
		}
		let skipStr = `Skipped to ${serverQueue.songs[1].title}!  Duration: ${serverQueue.songs[1].duration}\n`;
		message.channel.send(skipStr).then(message => {message.delete({timeout: 5000})}).catch();
		// play(message.guild, serverQueue.songs[0], serverQueue.videos[0], message); this somehow breaks the skip function
    } catch (err) {
		console.log(err);
		return message.reply('**Unable to skip.**').then(message => {message.delete({timeout: 5000})}).catch();
	}
}

async function search(message, serverQueue) {
	const query = message.content.substr(message.content.indexOf(' ')+1);

	message.channel.send(`Searching YouTube for ${query}`).then(message => {message.delete({timeout: 5000})}).catch();

	let results = [];

	ytSearch(query, function (err, r) {
		if ( err ) throw err

		results = r.videos; // Array with each item corresponding to a video.
	});
	await new Promise(done => setTimeout(done, 5000));

	let modifiedMessage = message;
	modifiedMessage.content = '!play https://www.youtube.com/watch/?v=' + results[0].videoId;
	execute(modifiedMessage, serverQueue);
}

client.login(process.env.TOKEN);