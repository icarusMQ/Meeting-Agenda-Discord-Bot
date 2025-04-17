const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getAgendaHistory, clearAgendaHistory } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historico')
    .setDescription('Operações com histórico de pautas anteriores')
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Listar o histórico de pautas anteriores'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('limpar')
        .setDescription('Limpar todo o histórico de pautas (apenas administradores)')),
  
  execute: handleAsync(async (interaction) => {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'limpar') {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Você não tem permissão para limpar o histórico. Apenas administradores podem usar este comando.',
          ephemeral: true
        });
      }
      
      // Solicitar confirmação antes de limpar o histórico
      const confirmButton = new ButtonBuilder()
        .setCustomId('history_clear_confirm')
        .setLabel('Confirmar Exclusão')
        .setStyle(ButtonStyle.Danger);
        
      const cancelButton = new ButtonBuilder()
        .setCustomId('history_clear_cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary);
        
      const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);
      
      const response = await interaction.reply({
        content: `⚠️ **Atenção - Operação Irreversível**\n\nVocê está prestes a excluir **TODO o histórico de pautas**!\nEsta ação não pode ser desfeita.\n\nTem certeza que deseja continuar?`,
        components: [row],
        ephemeral: true
      });
      
      try {
        const confirmation = await response.awaitMessageComponent({
          filter: i => i.user.id === interaction.user.id,
          time: 30000 // 30 segundos para responder
        });
        
        if (confirmation.customId === 'history_clear_confirm') {
          // Clear the history
          clearAgendaHistory();
          logger.info(`Histórico de pautas limpo por ${interaction.user.tag} (${interaction.user.id})`);
          
          await confirmation.update({
            content: '✅ O histórico de pautas foi completamente limpo.',
            components: [],
            ephemeral: true
          });
        } else {
          // Cancelado
          await confirmation.update({
            content: '❌ Operação cancelada. O histórico de pautas não foi alterado.',
            components: [],
            ephemeral: true
          });
        }
      } catch (error) {
        // Tempo expirado
        await interaction.editReply({
          content: '⏱️ O tempo para confirmação expirou. O histórico não foi alterado.',
          components: [],
          ephemeral: true
        });
      }
      
      return;
    }
    
    // Comando listar histórico
    const history = getAgendaHistory();
    
    if (history.length === 0) {
      return interaction.reply({
        content: "📚 **Histórico de Pautas**\n\nNão há pautas anteriores no histórico.",
        ephemeral: false
      });
    }
    
    // Sort history by date (newest first)
    history.sort((a, b) => b.archivedAt - a.archivedAt);
    
    // Create an embed for the history
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📚 Histórico de Pautas')
      .setDescription('Abaixo estão as pautas anteriores (mais recentes primeiro):')
      .setTimestamp();
    
    // Add each historical agenda to the embed
    for (const entry of history) {
      const date = new Date(entry.archivedAt);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - Semana ${entry.weekNumber}`;
      
      let itemsList = '';
      entry.items.forEach(item => {
        itemsList += `• ${item.text} (por ${item.suggestedBy})\n`;
      });
      
      if (!itemsList) {
        itemsList = 'Nenhum item na pauta';
      }
      
      embed.addFields({
        name: `📅 Pauta de ${formattedDate}`,
        value: itemsList
      });
    }
    
    // Add footer with count information
    embed.setFooter({ 
      text: `Total: ${history.length} pauta(s) no histórico | Histórico é mantido por 1 mês automaticamente` 
    });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
    
    logger.info(`Histórico de pautas visualizado por ${interaction.user.tag} (${interaction.user.id})`);
  })
};