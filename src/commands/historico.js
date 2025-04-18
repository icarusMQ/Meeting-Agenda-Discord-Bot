const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const { getAgendaHistory, clearAgendaHistory } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historico')
    .setDescription('Comandos relacionados ao histórico de pautas')
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Listar o histórico de pautas anteriores'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('limpar')
        .setDescription('Limpar o histórico de pautas (apenas administradores)')),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();
    
    // Subcomando para listar o histórico
    if (subcommand === 'listar') {
      const history = getAgendaHistory(guildId);
      
      if (history.length === 0) {
        return interaction.reply({
          content: '📜 **Histórico de Pautas**\n\nNão há pautas anteriores no histórico.',
          ephemeral: true
        });
      }
      
      // Ordenar do mais recente para o mais antigo
      const sortedHistory = [...history].sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
      
      // Criar um embed para mostrar as pautas anteriores
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📜 Histórico de Pautas')
        .setDescription(`Mostrando as ${Math.min(5, sortedHistory.length)} pautas mais recentes:`)
        .setTimestamp();
      
      // Adicionar até 5 pautas mais recentes
      sortedHistory.slice(0, 5).forEach((entry, index) => {
        const date = new Date(entry.archivedAt);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Criar uma string formatada dos itens de pauta
        let itemsText = '';
        if (entry.items && entry.items.length > 0) {
          itemsText = entry.items.map(item => `• ${item.text} (por ${item.suggestedBy})`).join('\n');
          // Truncar se for muito longo
          if (itemsText.length > 1024) {
            itemsText = itemsText.substring(0, 1021) + '...';
          }
        } else {
          itemsText = 'Nenhum item na pauta.';
        }
        
        embed.addFields({
          name: `📅 Semana ${entry.weekNumber} (Arquivada em ${formattedDate})`,
          value: itemsText
        });
      });
      
      // Adicionar informação sobre quantas pautas existem no total
      if (sortedHistory.length > 5) {
        embed.setFooter({
          text: `Mostrando 5 de ${sortedHistory.length} pautas no histórico.`
        });
      }
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: false
      });
      
      logger.info(`Guild ${guildId}: Histórico de pautas visualizado por ${interaction.user.tag} (${interaction.user.id})`);
    }
    
    // Subcomando para limpar o histórico (apenas admin)
    if (subcommand === 'limpar') {
      // Verificar se o usuário é administrador
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        logger.warn(`Guild ${guildId}: Usuário sem permissão tentou limpar histórico: ${interaction.user.tag} (${interaction.user.id})`);
        return interaction.reply({
          content: '❌ Você não tem permissão para limpar o histórico de pautas. Apenas administradores podem usar este comando.',
          ephemeral: true
        });
      }
      
      // Verificar se existe histórico
      const history = getAgendaHistory(guildId);
      if (history.length === 0) {
        return interaction.reply({
          content: '⚠️ Não há histórico de pautas para limpar.',
          ephemeral: true
        });
      }
      
      // Criar botões de confirmação
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_clear')
        .setLabel('Confirmar Limpeza')
        .setStyle(ButtonStyle.Danger);
      
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_clear')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary);
      
      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
      
      // Enviar mensagem com botões
      await interaction.reply({
        content: `⚠️ **Atenção**\n\nVocê está prestes a limpar permanentemente o histórico de pautas (${history.length} pautas). Esta ação não pode ser desfeita.\n\nDeseja continuar?`,
        components: [row],
        ephemeral: true
      });
      
      // Criar filtro para interações
      const filter = i => {
        if (i.user.id !== interaction.user.id) {
          i.reply({
            content: '❌ Estes botões não são para você.',
            ephemeral: true
          });
          return false;
        }
        return true;
      };
      
      try {
        // Aguardar interação do usuário
        const buttonInteraction = await interaction.channel.awaitMessageComponent({
          filter,
          componentType: ComponentType.Button,
          time: 30000 // 30 segundos para responder
        });
        
        // Remover botões da mensagem
        await buttonInteraction.update({
          components: []
        });
        
        if (buttonInteraction.customId === 'cancel_clear') {
          await buttonInteraction.editReply({
            content: '✅ Operação cancelada. O histórico de pautas não foi alterado.'
          });
          return;
        }
        
        if (buttonInteraction.customId === 'confirm_clear') {
          clearAgendaHistory(guildId);
          
          logger.info(`Guild ${guildId}: Histórico de pautas limpo por ${interaction.user.tag} (${interaction.user.id})`);
          
          await buttonInteraction.editReply({
            content: '✅ O histórico de pautas foi limpo com sucesso.'
          });
          
          // Também notificar no canal
          await interaction.channel.send({
            content: `⚠️ **Aviso**: ${interaction.user.toString()} limpou todo o histórico de pautas.`
          });
        }
      } catch (error) {
        // Timeout ou erro
        if (error.code === 'InteractionCollectorError') {
          await interaction.editReply({
            content: '⏱️ Tempo esgotado. O histórico de pautas não foi alterado.',
            components: []
          });
        } else {
          logger.error(`Erro ao processar interação: ${error.message}`, error);
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao processar sua solicitação.',
            components: []
          });
        }
      }
    }
  })
};