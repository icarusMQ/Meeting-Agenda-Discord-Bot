const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { approveSuggestion, getSuggestions, isUserAuthorized } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aprovar')
    .setDescription('Abre um menu dropdown para aprovar sugestões de pauta')
    .setDefaultMemberPermissions('0'), // Default to no one can use, we'll override with roles
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Check if the user has the leader role, is an administrator, or is in the authorized users list
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const hasAuthorizedRole = interaction.member.roles.cache.has(process.env.AUTHORIZED_ROLE_ID);
    const isAuthorized = isLeader || hasAuthorizedRole || isUserAuthorized(guildId, interaction.user.id);
    
    if (!isAuthorized) {
      logger.info(`Guild ${guildId}: Usuário sem permissão tentou aprovar sugestões: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não tem permissão para aprovar sugestões.',
        ephemeral: true
      });
    }
    
    // Get all pending suggestions for this guild
    const suggestions = getSuggestions(guildId);
    
    if (suggestions.length === 0) {
      return interaction.reply({
        content: '📝 Não há sugestões pendentes para aprovar.',
        ephemeral: true
      });
    }
    
    // Create options for the select menu
    const selectOptions = suggestions.map(suggestion => ({
      label: `#${suggestion.id}: ${suggestion.text.substring(0, 95)}${suggestion.text.length > 95 ? '...' : ''}`,
      description: `Sugerido por: ${suggestion.username}`,
      value: suggestion.id.toString()
    }));
    
    // Create the select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_suggestion')
      .setPlaceholder('Selecione uma sugestão para aprovar')
      .addOptions(selectOptions);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    // Send the message with the select menu
    const response = await interaction.reply({
      content: '📋 **Aprovar Sugestão**\n\nSelecione uma sugestão da lista abaixo para aprová-la e adicioná-la à pauta:',
      components: [row],
      ephemeral: true
    });
    
    logger.info(`Guild ${guildId}: Menu de aprovação de sugestões aberto por ${interaction.user.tag} (${interaction.user.id})`);
    
    // Create a collector for the menu interaction
    const collector = response.createMessageComponentCollector({ 
      componentType: ComponentType.StringSelect,
      time: 60000 // 1 minute timeout
    });
    
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ Este menu não é para você.',
          ephemeral: true
        });
      }
      
      const selectedId = parseInt(i.values[0], 10);
      const approved = approveSuggestion(guildId, selectedId);
      
      if (approved) {
        logger.info(`Guild ${guildId}: Sugestão #${selectedId} aprovada por ${interaction.user.tag} (${interaction.user.id})`);
        
        await i.update({
          content: `✅ **Sugestão Aprovada**\n\nVocê aprovou com sucesso a sugestão #${selectedId} e ela foi adicionada à pauta!\n\n📝 **${approved.text}**\n\nSugerida por: ${approved.suggestedBy}`,
          components: [],
          ephemeral: true
        });
        
        // Also send a message to the channel to notify everyone
        await interaction.channel.send({
          content: `✅ **Novo Item na Pauta**\n\n${interaction.user.toString()} aprovou a sugestão: \n📝 **${approved.text}**\n\nSugerida por: ${approved.suggestedBy}`
        });
      } else {
        logger.warn(`Guild ${guildId}: Falha ao aprovar sugestão #${selectedId} por ${interaction.user.tag} (${interaction.user.id})`);
        
        await i.update({
          content: `❌ Erro ao aprovar sugestão #${selectedId}. É possível que ela já tenha sido aprovada ou removida.`,
          components: [],
          ephemeral: true
        });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          content: '⏱️ Tempo esgotado. Nenhuma sugestão foi aprovada.',
          components: [],
          ephemeral: true
        });
      }
    });
  })
};