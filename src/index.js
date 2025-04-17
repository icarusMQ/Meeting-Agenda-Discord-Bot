require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
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

// Function to schedule the agenda reset job
let resetJob = null;

function scheduleAgendaReset() {
  // Cancel any existing job
  if (resetJob) {
    resetJob.stop();
  }
  
  // Get the cron schedule from settings
  const cronSchedule = getResetCronExpression();
  const resetDay = getSetting('resetDay', 0);
  const resetHour = getSetting('resetHour', 0);
  const resetMinute = getSetting('resetMinute', 0);
  const dayName = getDayName(resetDay);
  
  // Schedule the new job
  resetJob = cron.schedule(cronSchedule, () => {
    const formattedTime = `${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`;
    
    logger.info(`Executando reset agendado da pauta (${dayName.pt} às ${formattedTime})`);
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
      logger.error('Erro ao executar reset agendado da pauta:', error);
    }
  });
  
  logger.info(`Agendamento de reset configurado para ${dayName.pt} às ${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`);
}

// Initial scheduling of the agenda reset
scheduleAgendaReset();

// Store the scheduleAgendaReset function in the client for access from commands
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
