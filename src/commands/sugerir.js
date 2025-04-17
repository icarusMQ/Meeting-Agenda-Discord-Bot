const { SlashCommandBuilder } = require('discord.js');
const { addSuggestion } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerir')
    .setDescription('Sugere um item para a pauta')
    .addStringOption(option => 
      option.setName('texto')
            .setDescription('O texto a ser adicionado na pauta')
            .setRequired(true)
            .setMaxLength(1000)),
  
  execute: handleAsync(async (interaction) => {
    const text = interaction.options.getString('texto');
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    // Verificar se o texto é muito curto
    if (text.trim().length < 3) {
      return interaction.reply({
        content: '❌ Sua sugestão é muito curta. Por favor, forneça mais detalhes.',
        ephemeral: true
      });
    }
    
    const suggestion = addSuggestion(text, userId, username);
    
    logger.info(`Nova sugestão #${suggestion.id} adicionada por ${username} (${userId})`);
    
    // Responder ao usuário
    await interaction.reply({
      content: `✅ **Sugestão Registrada**\n\nSua sugestão #${suggestion.id} foi registrada com sucesso!\n📝 **${text}**\n\nUm usuário autorizado precisará aprová-la para ser adicionada à pauta.`,
      ephemeral: false
    });
    
    // Enviar uma cópia para o canal de sugestões se configurado
    const suggestionChannelId = process.env.SUGGESTION_CHANNEL_ID;
    if (suggestionChannelId) {
      try {
        const channel = interaction.client.channels.cache.get(suggestionChannelId);
        if (channel) {
          await channel.send({
            content: `📥 **Nova Sugestão #${suggestion.id}**\n\n${interaction.user.toString()} sugeriu:\n📝 **${text}**\n\nUse \`/aprovar\` para adicionar à pauta.`
          });
        }
      } catch (error) {
        logger.error(`Erro ao enviar sugestão para o canal de sugestões: ${error.message}`, error);
      }
    }
  })
};