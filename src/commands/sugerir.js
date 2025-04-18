const { SlashCommandBuilder } = require('discord.js');
const { addSuggestion } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerir')
    .setDescription('Sugere um item para a pauta da reunião')
    .addStringOption(option => 
      option.setName('texto')
            .setDescription('O texto do item de pauta')
            .setRequired(true)),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    const texto = interaction.options.getString('texto');
    
    // Adicionar à lista de sugestões para esta guild
    const suggestion = addSuggestion(
      guildId,
      texto, 
      interaction.user.id, 
      interaction.user.username
    );
    
    logger.info(`Guild ${guildId}: Nova sugestão #${suggestion.id} de ${interaction.user.tag} (${interaction.user.id}): "${texto.substring(0, 50)}${texto.length > 50 ? '...' : ''}"`);
    
    // Responder ao usuário
    await interaction.reply({
      content: `✅ Sua sugestão foi registrada com o ID #${suggestion.id}!\n\n📝 **${texto}**\n\nUm moderador irá revisar sua sugestão em breve.`,
      ephemeral: true
    });
    
    // Também notificar no canal (visível para todos)
    await interaction.channel.send({
      content: `📋 **Nova Sugestão de Pauta**\n\n${interaction.user.toString()} sugeriu:\n📝 **${texto}**\n\nSugestão #${suggestion.id} aguardando aprovação.`
    });
  })
};