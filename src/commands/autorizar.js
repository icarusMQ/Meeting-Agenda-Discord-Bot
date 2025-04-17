const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addAuthorizedUser } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorizar')
    .setDescription('Autoriza um usuário a aprovar sugestões de pauta')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que será autorizado a aprovar sugestões')
        .setRequired(true)),
  
  execute: handleAsync(async (interaction) => {
    // Only users with the leader role or administrators can add authorized users
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isLeader) {
      logger.info(`Tentativa não autorizada de usar comando autorizar: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não tem permissão para autorizar outros usuários.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    
    // Não permitir auto-autorização
    if (targetUser.id === interaction.user.id) {
      logger.warn(`Usuário tentou autorizar a si mesmo: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não pode autorizar a si mesmo.',
        ephemeral: true
      });
    }
    
    // Verificar se o usuário é um bot
    if (targetUser.bot) {
      logger.warn(`Tentativa de autorizar um bot: ${targetUser.tag} por ${interaction.user.tag}`);
      return interaction.reply({
        content: '❌ Bots não podem ser autorizados a aprovar sugestões.',
        ephemeral: true
      });
    }
    
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    
    // Add user to authorized list
    const success = addAuthorizedUser(targetUser.id, targetUser.username);
    
    if (success) {
      logger.info(`Usuário ${targetUser.tag} (${targetUser.id}) autorizado por ${interaction.user.tag} (${interaction.user.id})`);
      
      // Try to add the authorized role to the user
      try {
        const authorizedRole = interaction.guild.roles.cache.get(process.env.AUTHORIZED_ROLE_ID);
        if (authorizedRole) {
          await targetMember.roles.add(authorizedRole);
          logger.debug(`Papel de autorizado adicionado a ${targetUser.tag}`);
        } else {
          logger.warn(`Papel de autorizado não encontrado (AUTHORIZED_ROLE_ID: ${process.env.AUTHORIZED_ROLE_ID})`);
        }
      } catch (error) {
        logger.error(`Erro ao adicionar papel ao usuário ${targetUser.tag}:`, error);
        
        return interaction.reply({
          content: `✅ **${targetUser.username}** foi adicionado à lista de autorizados, mas não foi possível adicionar o papel. Verifique as permissões do bot ou se o AUTHORIZED_ROLE_ID está configurado corretamente.`,
          ephemeral: true
        });
      }
      
      // Notificar o usuário que recebeu a autorização
      try {
        await targetUser.send({
          content: `✅ **Você foi autorizado**\n\nVocê recebeu permissão para aprovar sugestões de pauta no servidor **${interaction.guild.name}**.\n\nUse o comando \`/aprovar\` para aprovar sugestões.`
        });
        logger.debug(`Mensagem de notificação enviada para ${targetUser.tag}`);
      } catch (error) {
        logger.warn(`Não foi possível enviar DM para ${targetUser.tag}: ${error.message}`);
      }
      
      return interaction.reply({
        content: `✅ **${targetUser.username}** agora está autorizado a aprovar sugestões de pauta.`,
        ephemeral: false
      });
    } else {
      return interaction.reply({
        content: `ℹ️ **${targetUser.username}** já está autorizado a aprovar sugestões.`,
        ephemeral: true
      });
    }
  })
};