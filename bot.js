require('dotenv').config()

const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');

var youtubedl = require('youtube-dl');
var fs = require('fs');

const client = new Discord.Client();

const queue = new Map();

client.once('ready', () => {
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

	if (message.content.startsWith(`${prefix}play`)) {
		execute(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}next`)) {
		next(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}stop`)) {
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
	} else if (message.content.startsWith(`${prefix}search`)) { // WIP - Don't try yet
		search(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}hail`)) {
        message.content = `${prefix}play https://www.youtube.com/watch?v=EF--ldYIBnM`;
		execute(message, serverQueue);
		return;
	} else {
		message.reply('Invalid command').then(message => {message.delete({timeout: 5000})}).catch();
	}

});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');
	if (!!!message.member.voice.channel) {
		return message.reply('You need to be in a voice channel to play music!').then(message => {message.delete({timeout: 5000})}).catch();
	}
	const voiceChannel = message.member.voice.channel;
	const permissions = voiceChannel.speakable;
	if (!permissions) return message.channel.send('I need the permissions to join and speak in your voice channel!');

	let song = {
		title: '',
		url: '',
		source: '',
		duration: ''
	};

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
	});
	await new Promise(done => setTimeout(done, 5000));

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

		message.channel.send(`Queue initiated with ${song.title}! Duration: ${song.duration}`).then(message => {message.delete({timeout: 10000})}).catch();

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push(song);
		queueContruct.videos.push(video);

		try {
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			play(message.guild, queueContruct.songs[0], queueContruct.videos[0]);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		serverQueue.videos.push(video);
		return message.reply(`${song.title} has been added to the queue! Duration: ${song.duration}`).then(message => {message.delete({timeout: 10000})}).catch();
	}

}

function next(message, serverQueue) {
	if (typeof message.member.voice == 'undefined') return message.reply('You have to be in a voice channel to skip a song!');
	if (!serverQueue) return message.reply('There is no song that I can skip!').then(message => {message.delete({timeout: 5000})}).catch();
	serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
	if (typeof message.member.voice == 'undefined') return message.reply('You have to be in a voice channel to stop the music!');
	try {
		serverQueue.songs = [];
		serverQueue.videos = [];
		serverQueue.connection.dispatcher.end();
	} catch (err) {
		console.log(err);
		return message.reply('Unable to stop playback.').then(message => {message.delete({timeout: 5000})}).catch();
	}
}

async function play(guild, song, video) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		console.log('not song??');
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

    client.user.setActivity(song.title);

	let writeStream = await video.pipe(fs.createWriteStream('yee.webm', {flags: 'w'}));
	await new Promise(done => setTimeout(done, 5000));

	let readStream = fs.createReadStream('yee.webm');
	const dispatcher = serverQueue.connection.play(readStream)
		.on('end', () => {
			console.log('Music ended!');
			writeStream.end();
			client.user.setActivity();
			serverQueue.songs.shift();
			serverQueue.videos.shift();
			play(guild, serverQueue.songs[0], serverQueue.videos[0]);
		})
		.on('error', error => {
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

function pause(message, serverQueue) {
    if (typeof message.member.voice == 'undefined') return message.reply('You have to be in a voice channel to pause the music!').then(message => {message.delete({timeout: 5000})}).catch();
    if (!serverQueue) return message.reply('There is no song that I can pause!').then(message => {message.delete({timeout: 5000})}).catch();
    
    serverQueue.connection.dispatcher.pause();
}

function resume(message, serverQueue) {
    if (typeof message.member.voice == 'undefined') return message.reply('You have to be in a voice channel to resume the music!').then(message => {message.delete({timeout: 5000})}).catch();
    if (!serverQueue) return message.reply('There is no song that I could resume!').then(message => {message.delete({timeout: 5000})}).catch();
    
    serverQueue.connection.dispatcher.resume();
}

function displayQueue(message, serverQueue) {
	if (typeof message.member.voice == 'undefined') return message.reply('You have to be in a voice channel to stop the music!').then(message => {message.delete({timeout: 5000})}).catch();
	
    if (!serverQueue) return message.reply('Queue doesn\'t exist!').then(message => {message.delete({timeout: 5000})}).catch();
	let queueStr = '';
    for (const song of Object.entries(serverQueue.songs)) {
		queueStr = `${queueStr}` + `[` + (parseInt(song[0]) + 1) + `] ${song[1].title}\n`;
	}
	message.channel.send(queueStr).then(message => {message.delete({timeout:serverQueue.songs.length * 3000})}).catch();
}

function skipTo(message, serverQueue) {
    const args = message.content.split(' ');
	if (typeof message.member.voice == 'undefined') return message.reply('You have to be in a voice channel to skip songs!').then(message => {message.delete({timeout: 5000})}).catch();
    
    try {
    	serverQueue.connection.dispatcher.end();
    	let count = 1;
	    while (count < Number(args[1])-1) {
	    	serverQueue.songs.shift();
			serverQueue.videos.shift();
			count++;
		}
		play(message.guild, serverQueue.songs[0], serverQueue.videos[0]);
    } catch (err) {
		console.log(err);
		return message.reply('Unable to skip.').then(message => {message.delete({timeout: 5000})}).catch();
	}
}


// WIP 
function search(message, serverQueue) {
	const query = '\"' + message.content.split(' ')[1] + '\"';
	let modifiedMessage = message;
	console.log('here1!');

youtubedl.exec(query, ['--default-search', '\"ytsearch1:\"', '--flat-playlist', '-j'], {}, function(err, output) {
		if (err) {
			throw err;
			message.channel.send('Error finding audio').then(message => {message.delete({timeout: 5000})}).catch();
			return;
		}
		console.log('here2!');
		modifiedMessage.content = '!play https://www.youtube.com/watch/v=' + output["url"];
		execute(modifiedMessage, serverQueue);
	});
}

client.login(process.env.TOKEN);