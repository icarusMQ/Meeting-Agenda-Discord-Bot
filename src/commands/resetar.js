const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { resetAgenda, resetSuggestions } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetar')
    .setDescription('Resetar a pauta atual e salvar no histórico')
    .addBooleanOption(option =>
      option.setName('sugestoes')
        .setDescription('Resetar também as sugestões pendentes?')
        .setRequired(false)),
  
  execute: handleAsync(async (interaction) => {
    // Only users with admin permissions can reset the agenda
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para resetar a pauta. Apenas administradores podem usar este comando.',
        ephemeral: true
      });
    }
    
    const resetSugs = interaction.options.getBoolean('sugestoes');
    const resetType = resetSugs ? 'completo (pauta e sugestões)' : 'parcial (apenas pauta)';
    
    // Criar botões de confirmação
    const confirmButton = new ButtonBuilder()
      .setCustomId('reset_confirm')
      .setLabel('Confirmar Reset')
      .setStyle(ButtonStyle.Danger);
      
    const cancelButton = new ButtonBuilder()
      .setCustomId('reset_cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary);
      
    const row = new ActionRowBuilder()
      .addComponents(confirmButton, cancelButton);
    
    // Enviar mensagem com botões de confirmação
    const response = await interaction.reply({
      content: `⚠️ **Confirmação de Reset**\n\nVocê está prestes a realizar um reset ${resetType} da pauta atual.\nEsta ação guardará a pauta atual no histórico e criará uma nova pauta vazia.\n\nVocê tem certeza que deseja continuar?`,
      components: [row],
      ephemeral: true
    });
    
    // Coletor para resposta dos botões
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 60000 // 1 minuto para responder
      });
      
      if (confirmation.customId === 'reset_confirm') {
        // Executar o reset
        resetAgenda();
        logger.info(`Pauta resetada manualmente por ${interaction.user.tag} (${interaction.user.id})`);
        
        if (resetSugs) {
          resetSuggestions();
          logger.info(`Sugestões resetadas manualmente por ${interaction.user.tag} (${interaction.user.id})`);
          
          await confirmation.update({
            content: '✅ A pauta foi resetada com sucesso! Todas as sugestões pendentes também foram removidas.',
            components: [],
            ephemeral: true
          });
          
          // Enviar anúncio no canal
          await interaction.channel.send({
            content: `📢 **Pauta Resetada**\n\n${interaction.user.toString()} realizou um reset completo da pauta. Uma nova pauta está disponível para sugestões!`
          });
        } else {
          await confirmation.update({
            content: '✅ A pauta foi resetada com sucesso! Sugestões pendentes foram mantidas.',
            components: [],
            ephemeral: true
          });
          
          // Enviar anúncio no canal
          await interaction.channel.send({
            content: `📢 **Pauta Resetada**\n\n${interaction.user.toString()} realizou um reset da pauta. Uma nova pauta está disponível, mantendo as sugestões pendentes!`
          });
        }
      } else {
        // Cancelado
        await confirmation.update({
          content: '❌ Operação de reset cancelada.',
          components: [],
          ephemeral: true
        });
      }
    } catch (error) {
      // Tempo expirado
      await interaction.editReply({
        content: '⏱️ O tempo para confirmação expirou. A operação de reset foi cancelada.',
        components: [],
        ephemeral: true
      });
    }
  })
};