import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import WebSocket from 'ws';

// ===== LOAD FROM .env =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const STREAMERBOT_WS_URL = process.env.STREAMERBOT_WS_URL;

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// ===== STREAMER.BOT CONNECTION =====
let ws;

function connectToStreamerBot() {
  ws = new WebSocket(STREAMERBOT_WS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to Streamer.bot WebSocket');
  });

  ws.on('close', () => {
    console.log('❌ Disconnected from Streamer.bot, retrying in 5s...');
    setTimeout(connectToStreamerBot, 5000);
  });

  ws.on('error', (err) => {
    console.error('⚠️ WebSocket error:', err.message);
  });
}

// ===== HANDLE AVRAE EMBEDS =====
client.on('messageCreate', async (message) => {
  // Only process Avrae messages
  if (message.author.bot && message.author.username === 'Avrae') {
    const embed = message.embeds[0];
    if (!embed) return;

    const embedData = {
      title: embed.title,
      description: embed.description,
      fields: embed.fields?.map(f => ({ name: f.name, value: f.value })),
      footer: embed.footer?.text,
      timestamp: message.createdTimestamp,
    };

    console.log(`📨 Avrae Embed Detected: ${embed.title || 'No title'}`);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: "AvraeMessage",
        data: embedData
      }));
      console.log('📤 Sent embed data to Streamer.bot');
    } else {
      console.warn('⚠️ Streamer.bot WebSocket not connected.');
    }
  }
});

// ===== READY EVENT =====
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

// ===== START =====
connectToStreamerBot();
client.login(DISCORD_TOKEN);
