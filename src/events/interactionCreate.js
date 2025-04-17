// src/events/interactionCreate.js
const { handleAsync } = require('../utils/errorHandler');
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  once: false,
  execute: handleAsync(async (interaction, client) => {
    if (!interaction.isChatInputCommand()) return;
    
    const commandName = interaction.commandName;
    const command = interaction.client.commands.get(commandName);
    
    if (!command) {
      logger.warn(`Comando não encontrado: ${commandName}`);
      return;
    }
    
    logger.info(`Executando comando: ${commandName} | Usuário: ${interaction.user.tag} (${interaction.user.id})`);
    
    await command.execute(interaction);
  })
};
