const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Bot iniciado com sucesso como ${client.user.tag}`);
    logger.info(`Servindo em ${client.guilds.cache.size} servidores`);
    
    // Atualizar status do bot
    client.user.setActivity('Gerenciando pautas | /ajuda', { type: 'PLAYING' });
  },
};
