const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { removeAuthorizedUser, getAuthorizedUsers } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desautorizar')
    .setDescription('Remove a autorização de um usuário para aprovar sugestões')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que terá a autorização removida')
        .setRequired(true)),
  
  execute: handleAsync(async (interaction) => {
    // Only users with the leader role or administrators can remove authorized users
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isLeader) {
      return interaction.reply({
        content: '❌ Você não tem permissão para remover autorizações.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    
    // Solicitar confirmação antes de remover a autorização
    const confirmButton = new ButtonBuilder()
      .setCustomId('deauth_confirm')
      .setLabel('Confirmar Remoção')
      .setStyle(ButtonStyle.Danger);
      
    const cancelButton = new ButtonBuilder()
      .setCustomId('deauth_cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary);
      
    const row = new ActionRowBuilder()
      .addComponents(confirmButton, cancelButton);
    
    const response = await interaction.reply({
      content: `⚠️ **Confirmação Necessária**\n\nVocê está prestes a remover a autorização de **${targetUser.username}**.\nEste usuário não poderá mais aprovar itens para a pauta.\n\nDeseja continuar?`,
      components: [row],
      ephemeral: true
    });
    
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 30000 // 30 segundos para responder
      });
      
      if (confirmation.customId === 'deauth_confirm') {
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        
        // Remove user from authorized list
        const success = removeAuthorizedUser(targetUser.id);
        
        if (success) {
          logger.info(`Usuário ${targetUser.tag} (${targetUser.id}) desautorizado por ${interaction.user.tag} (${interaction.user.id})`);
          
          // Try to remove the authorized role from the user
          try {
            const authorizedRole = interaction.guild.roles.cache.get(process.env.AUTHORIZED_ROLE_ID);
            if (authorizedRole && targetMember.roles.cache.has(process.env.AUTHORIZED_ROLE_ID)) {
              await targetMember.roles.remove(authorizedRole);
            }
          } catch (error) {
            logger.error(`Erro ao remover papel de autorizado do usuário ${targetUser.tag}:`, error);
            
            await confirmation.update({
              content: `✅ **${targetUser.username}** foi removido da lista de autorizados, mas não foi possível remover o papel. Verifique as permissões do bot.`,
              components: [],
              ephemeral: true
            });
            return;
          }
          
          await confirmation.update({
            content: `✅ **${targetUser.username}** não está mais autorizado a aprovar sugestões.`,
            components: [],
            ephemeral: true
          });
        } else {
          await confirmation.update({
            content: `ℹ️ **${targetUser.username}** não estava na lista de usuários autorizados.`,
            components: [],
            ephemeral: true
          });
        }
      } else {
        // Cancelado
        await confirmation.update({
          content: `✅ Operação cancelada. **${targetUser.username}** manteve suas autorizações.`,
          components: [],
          ephemeral: true
        });
      }
    } catch (error) {
      // Tempo expirado
      await interaction.editReply({
        content: `⏱️ O tempo para confirmação expirou. **${targetUser.username}** manteve suas autorizações.`,
        components: [],
        ephemeral: true
      });
    }
  })
};