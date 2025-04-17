require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { resetAgenda } = require('./utils/agenda');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create a Collection to store commands
client.commands = new Collection();

// Dynamically read command files
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(`./commands/${file}`);
  // each module exports { data, execute }
  client.commands.set(command.data.name, command);
}

// Load events dynamically
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).forEach(file => {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
});

// Schedule weekly agenda reset (Runs every Sunday at midnight)
cron.schedule('0 0 * * 0', () => {
  console.log('Executing scheduled weekly agenda reset');
  resetAgenda();
  
  // Notify a specific channel about the reset if configured
  const notificationChannelId = process.env.NOTIFICATION_CHANNEL_ID;
  if (notificationChannelId) {
    try {
      const channel = client.channels.cache.get(notificationChannelId);
      if (channel) {
        channel.send('📢 **Aviso Automático**: A pauta da semana foi resetada. Uma nova pauta está disponível!');
      }
    } catch (error) {
      console.error('Error sending notification about agenda reset:', error);
    }
  }
});

client.login(process.env.BOT_TOKEN);
