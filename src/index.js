require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const http = require('http'); // Add HTTP module for health check
const { resetAgenda } = require('./utils/agenda');
const logger = require('./utils/logger');
const { setupGlobalErrorHandlers } = require('./utils/errorHandler');
const { getSetting, getResetCronExpression, getDayName } = require('./utils/settings');

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

// Storage for guild-specific reset jobs
const resetJobs = new Map();

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

/**
 * Schedule the agenda reset job for a specific guild
 * @param {string} guildId - The guild ID to schedule for
 */
function scheduleAgendaReset(guildId) {
  // Cancel any existing job for this guild
  if (resetJobs.has(guildId)) {
    resetJobs.get(guildId).stop();
    resetJobs.delete(guildId);
  }
  
  // Get the cron schedule from guild settings
  const cronSchedule = getResetCronExpression(guildId);
  const resetDay = getSetting(guildId, 'resetDay', 0);
  const resetHour = getSetting(guildId, 'resetHour', 0);
  const resetMinute = getSetting(guildId, 'resetMinute', 0);
  const dayName = getDayName(resetDay);
  
  // Schedule the new job
  try {
    const job = cron.schedule(cronSchedule, () => {
      const formattedTime = `${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`;
      
      logger.info(`Guild ${guildId}: Executando reset agendado da pauta (${dayName} às ${formattedTime})`);
      
      try {
        resetAgenda(guildId);
        
        // Notify the guild's notification channel
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          const notificationChannelId = process.env.NOTIFICATION_CHANNEL_ID;
          if (notificationChannelId) {
            try {
              const channel = guild.channels.cache.get(notificationChannelId);
              if (channel) {
                channel.send('📢 **Aviso Automático**: A pauta da semana foi resetada. Uma nova pauta está disponível!');
                logger.info(`Guild ${guildId}: Notificação de reset enviada para o canal ${notificationChannelId}`);
              } else {
                logger.warn(`Guild ${guildId}: Canal de notificação ${notificationChannelId} não encontrado`);
              }
            } catch (error) {
              logger.error(`Guild ${guildId}: Erro ao enviar notificação sobre o reset da pauta:`, error);
            }
          }
        } else {
          logger.warn(`Guild ${guildId}: Guild não encontrada ao executar reset agendado`);
        }
      } catch (error) {
        logger.error(`Guild ${guildId}: Erro ao executar reset agendado da pauta:`, error);
      }
    });
    
    resetJobs.set(guildId, job);
    logger.info(`Guild ${guildId}: Agendamento de reset configurado para ${dayName} às ${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`);
  } catch (error) {
    logger.error(`Guild ${guildId}: Erro ao agendar reset:`, error);
  }
}

// When the bot is ready, schedule reset jobs for all guilds
client.once('ready', () => {
  client.guilds.cache.forEach(guild => {
    scheduleAgendaReset(guild.id);
  });
});

// Handle guild join event to set up reset jobs for new guilds
client.on('guildCreate', (guild) => {
  logger.info(`Bot adicionado a um novo servidor: ${guild.name} (${guild.id})`);
  scheduleAgendaReset(guild.id);
});

// Make the scheduleAgendaReset function available to commands
client.scheduleAgendaReset = scheduleAgendaReset;

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

// Health check server for DigitalOcean
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    logger.debug(`Health check request received and responded with 200 OK`);
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT, () => {
  logger.info(`Health check server listening on port ${PORT}`);
});
