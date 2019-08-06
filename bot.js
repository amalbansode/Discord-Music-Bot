const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');

var youtubedl = require('youtube-dl');

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
		message.reply('Invalid command').then(message => {message.delete(4000)}).catch();
	}

});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');

	const voiceChannel = message.member.voiceChannel;
	if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!').then(message => {message.delete(4000)}).catch();
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('I need the permissions to join and speak in your voice channel!');
	}

	let song = {
		title: '',
		url: '',
		source: '',
	};

	await youtubedl.getInfo(args[1], ['--format=bestaudio', '--user-agent', '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.50 Safari/537.36"', '-i', '--no-warnings'], async function(err, info) {
		if (err) {
			message.channel.send('Error finding audio').then(message => {message.delete(4000)}).catch();
			return;
		}
		song.title = info.title;
		song.url = args[1];
		song.source = info.url.replace('ip=\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b','ip=106.201.116.246');
		// console.log(info.url);
	});
	await new Promise(done => setTimeout(done, 15000));
	console.log(song);

	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};

		message.channel.send(`Queue initiated with ${song.title}!`).then(message => {message.delete(4000)}).catch();

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push(song);

		try {
			var connection = await voiceChannel.join().then(connection => console.log('Connected!')).catch(console.error);
			queueContruct.connection = connection;
			play(message.guild, queueContruct.songs[0]);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		return message.reply(`${song.title} has been added to the queue!`).then(message => {message.delete(4000)}).catch();
	}

}

function next(message, serverQueue) {
	if (!message.member.voiceChannel) return message.reply('You have to be in a voice channel to stop the music!');
	if (!serverQueue) return message.reply('There is no song that I can skip!').then(message => {message.delete(4000)}).catch();
	serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
	if (!message.member.voiceChannel) return message.reply('You have to be in a voice channel to stop the music!');
	try {
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end();
	} catch (err) {
		console.log(err);
		return message.reply('Unable to stop playback.').then(message => {message.delete(4000)}).catch();
	}
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		console.log('not song??');
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	client.user.setActivity(song.title);

	const broadcast = client.createVoiceBroadcast().playStream(song.source);
	broadcast.setVolumeLogarithmic(serverQueue.volume / 5);
	const dispatcher = serverQueue.connection.playBroadcast(broadcast)
		.on('end', () => {
			console.log('Music ended!');
			client.user.setActivity();
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.error(error);
		});

	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

function pause(message, serverQueue) {
    if (!message.member.voiceChannel) return message.reply('You have to be in a voice channel to pause the music!').then(message => {message.delete(4000)}).catch();
    if (!serverQueue) return message.reply('There is no song that I can pause!').then(message => {message.delete(4000)}).catch();
    
    serverQueue.connection.dispatcher.pause();
}

function resume(message, serverQueue) {
    if (!message.member.voiceChannel) return message.reply('You have to be in a voice channel to resume the music!').then(message => {message.delete(4000)}).catch();
    if (!serverQueue) return message.reply('There is no song that I could resume!').then(message => {message.delete(4000)}).catch();
    
    serverQueue.connection.dispatcher.resume();
}

function displayQueue(message, serverQueue) {
	if (!message.member.voiceChannel) return message.reply('You have to be in a voice channel to stop the music!').then(message => {message.delete(4000)}).catch();
	
	let queueStr = '';
    for (const song of Object.entries(serverQueue.songs)) {
		queueStr = `${queueStr}` + `[` + (parseInt(song[0]) + 1) + `] ${song[1].title}\n`;
	}
	message.channel.send(queueStr).then(message => {message.delete(serverQueue.songs.length * 3000)}).catch();
}

function skipTo(message, serverQueue) {
    const args = message.content.split(' ');

	if (!message.member.voiceChannel) return message.reply('You have to be in a voice channel to stop the music!').then(message => {message.delete(4000)}).catch();
    
    let count = 1;
    while (count < args[1]) {
        next(message, serverQueue);
        count++;
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
			message.channel.send('Error finding audio').then(message => {message.delete(4000)}).catch();
			return;
		}
		console.log('here2!');
		modifiedMessage.content = '!play https://www.youtube.com/watch/v=' + output["url"];
		execute(modifiedMessage, serverQueue);
	});
}

client.login(token);