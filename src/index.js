require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { resetAgenda } = require('./utils/agenda');
const logger = require('./utils/logger');
const { setupGlobalErrorHandlers } = require('./utils/errorHandler');

// Configurar manipuladores de erro globais
setupGlobalErrorHandlers();

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
logger.info(`Carregando comandos do diretório: ${commandsPath}`);

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  try {
    const command = require(`./commands/${file}`);
    // each module exports { data, execute }
    client.commands.set(command.data.name, command);
    logger.info(`Comando carregado: ${command.data.name}`);
  } catch (error) {
    logger.error(`Erro ao carregar comando ${file}:`, error);
  }
}

// Load events dynamically
const eventsPath = path.join(__dirname, 'events');
logger.info(`Carregando eventos do diretório: ${eventsPath}`);

fs.readdirSync(eventsPath).forEach(file => {
  try {
    const event = require(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    logger.info(`Evento carregado: ${event.name}`);
  } catch (error) {
    logger.error(`Erro ao carregar evento ${file}:`, error);
  }
});

// Schedule weekly agenda reset (Runs every Sunday at midnight)
cron.schedule('0 0 * * 0', () => {
  logger.info('Executando reset semanal agendado da pauta');
  try {
    resetAgenda();
    
    // Notify a specific channel about the reset if configured
    const notificationChannelId = process.env.NOTIFICATION_CHANNEL_ID;
    if (notificationChannelId) {
      try {
        const channel = client.channels.cache.get(notificationChannelId);
        if (channel) {
          channel.send('📢 **Aviso Automático**: A pauta da semana foi resetada. Uma nova pauta está disponível!');
          logger.info(`Notificação de reset enviada para o canal ${notificationChannelId}`);
        } else {
          logger.warn(`Canal de notificação ${notificationChannelId} não encontrado`);
        }
      } catch (error) {
        logger.error('Erro ao enviar notificação sobre o reset da pauta:', error);
      }
    }
  } catch (error) {
    logger.error('Erro ao executar reset semanal da pauta:', error);
  }
});

// Listener para erros de conexão
client.on('error', (error) => {
  logger.error('Erro na conexão do Discord:', error);
});

// Login ao Discord
client.login(process.env.BOT_TOKEN)
  .then(() => {
    logger.info('Bot conectado ao Discord com sucesso!');
  })
  .catch((error) => {
    logger.error('Falha ao conectar ao Discord:', error);
    process.exit(1);
  });
