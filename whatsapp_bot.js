const venom = require('venom-bot');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

venom.create().then((client) => start(client));

// Store user ratings
const userRatings = {};

async function start(client) {
  client.onMessage(async (message) => {
    if (message.body.startsWith('/start')) {
      await client.sendText(message.from, '🤖 Welcome to the YouTube Downloader Bot! Send me a YouTube link to get started.\n\nYou can also type "/help" to see available commands.');
    } else if (message.body.toLowerCase() === '/help') {
      await client.sendText(message.from, '📚 Available commands:\n\n/sendlink - Send a YouTube link to download audio.\n/help - Display available commands.\n/rate - Rate the bot (1-5)');
    } else if (message.body.toLowerCase() === '/rate') {
      await client.sendText(message.from, 'Rate the bot (1-5):\n\n1 ⭐ - Terrible\n2 ⭐⭐ - Not great\n3 ⭐⭐⭐ - Good\n4 ⭐⭐⭐⭐ - Great\n5 ⭐⭐⭐⭐⭐ - Excellent');
    } else if (ytdl.validateURL(message.body)) {
      const info = await ytdl.getInfo(message.body);
      const searchResults = info.formats.map((format, index) => {
        return `${index + 1}. ${format.qualityLabel} ${format.mimeType}`;
      }).join('\n');

      const response = `Search results:\n${searchResults}\n\nReply with the number of the format you want to download.`;
      await client.sendText(message.from, response);
    } else if (message.body.startsWith('/rate')) {
      const rating = parseInt(message.body.split(' ')[1]);
      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
        userRatings[message.from] = rating;
        await client.sendText(message.from, 'Thank you for your rating! 🌟');
      } else {
        await client.sendText(message.from, 'Invalid rating. Please use "/rate [1-5]" to rate the bot.');
      }
    } else {
      await client.sendText(message.from, 'Please send a valid YouTube link or type "/help" for available commands.');
    }
  });

  client.onMessage(async (message) => {
    const selectedFormatIndex = parseInt(message.body) - 1;

    if (!isNaN(selectedFormatIndex) && selectedFormatIndex >= 0) {
      const info = await ytdl.getInfo(message.quotedMsgObj.body);
      const selectedFormat = info.formats[selectedFormatIndex];

      const videoStream = ytdl(message.quotedMsgObj.body, { quality: selectedFormat.itag });
      const outputPath = 'downloaded_audio.mp3';

      videoStream.pipe(ffmpeg()
        .input(videoStream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .on('end', () => {
          const response = `🎵 Downloaded Audio.mp3\n\n📺 Video Thumbnail: ${info.videoDetails.thumbnail.thumbnails[0].url}\n\nBot by: CODDED BY TELVIN TEUM\nOwner Contact: +254792052669\n\nPlease rate the bot using "/rate [1-5]".`;
          client.sendFile(message.from, outputPath, 'Downloaded Audio.mp3', response);
        })
        .on('error', (error) => {
          console.error('Error processing audio:', error);
          client.sendText(message.from, 'Error processing audio. Please try again.');
        })
        .save(outputPath)
      );
    }
  });
}
