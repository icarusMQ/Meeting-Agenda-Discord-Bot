const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { removeAuthorizedUser, isUserAuthorized, getAuthorizedUsers } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desautorizar')
    .setDescription('Remove autorização de um usuário para aprovar sugestões')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option => 
      option.setName('usuario')
            .setDescription('O usuário a ter autorização removida')
            .setRequired(true)),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Verificar se o usuário tem o papel de líder ou é administrador
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isLeader) {
      logger.info(`Guild ${guildId}: Usuário sem permissão tentou desautorizar: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não tem permissão para remover autorização de usuários. Apenas líderes e administradores podem usar este comando.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    
    // Verificar se o usuário está autorizado
    if (!isUserAuthorized(guildId, targetUser.id)) {
      logger.info(`Guild ${guildId}: Tentativa de desautorizar usuário que não está autorizado: ${targetUser.tag} (${targetUser.id})`);
      return interaction.reply({
        content: `⚠️ ${targetUser.toString()} não está na lista de usuários autorizados.`,
        ephemeral: true
      });
    }
    
    // Criar botões de confirmação
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirmar')
      .setStyle(ButtonStyle.Danger);
    
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
    // Enviar mensagem com os botões
    await interaction.reply({
      content: `⚠️ **Confirmação**\n\nVocê está prestes a remover a autorização de ${targetUser.toString()} para aprovar sugestões de pauta.\n\nDeseja continuar?`,
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
      
      // Remover os botões
      await buttonInteraction.update({
        components: []
      });
      
      if (buttonInteraction.customId === 'cancel') {
        await buttonInteraction.editReply({
          content: '✅ Operação cancelada.'
        });
        return;
      }
      
      if (buttonInteraction.customId === 'confirm') {
        // Remover da lista de autorizados
        const success = removeAuthorizedUser(guildId, targetUser.id);
        
        if (success) {
          logger.info(`Guild ${guildId}: Usuário ${targetUser.tag} (${targetUser.id}) foi desautorizado por ${interaction.user.tag} (${interaction.user.id})`);
          
          await buttonInteraction.editReply({
            content: `✅ ${targetUser.toString()} não está mais autorizado a aprovar sugestões.`
          });
          
          // Também enviar uma mensagem no canal para notificar
          await interaction.channel.send({
            content: `⚠️ **Aviso**: ${interaction.user.toString()} removeu a autorização de ${targetUser.toString()} para aprovar sugestões de pauta.`
          });
        } else {
          logger.error(`Guild ${guildId}: Erro ao desautorizar usuário ${targetUser.tag} (${targetUser.id})`);
          
          await buttonInteraction.editReply({
            content: `❌ Ocorreu um erro ao remover a autorização de ${targetUser.toString()}.`
          });
        }
      }
    } catch (error) {
      // Timeout ou erro
      if (error.code === 'InteractionCollectorError') {
        await interaction.editReply({
          content: '⏱️ Tempo esgotado. A operação foi cancelada.',
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
  })
};