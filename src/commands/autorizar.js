const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addAuthorizedUser, isUserAuthorized } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorizar')
    .setDescription('Autoriza um usuário a aprovar sugestões')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option => 
      option.setName('usuario')
            .setDescription('O usuário a ser autorizado')
            .setRequired(true)),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Verificar se o usuário tem o papel de líder ou é administrador
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isLeader) {
      logger.info(`Guild ${guildId}: Usuário sem permissão tentou autorizar: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não tem permissão para autorizar usuários. Apenas líderes e administradores podem usar este comando.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    
    // Verificar se o usuário já está autorizado
    if (isUserAuthorized(guildId, targetUser.id)) {
      logger.info(`Guild ${guildId}: Tentativa de autorizar usuário que já está autorizado: ${targetUser.tag} (${targetUser.id})`);
      return interaction.reply({
        content: `⚠️ ${targetUser.toString()} já está autorizado a aprovar sugestões.`,
        ephemeral: true
      });
    }
    
    // Adicionar à lista de autorizados
    const success = addAuthorizedUser(guildId, targetUser.id, targetUser.username);
    
    if (success) {
      logger.info(`Guild ${guildId}: Usuário ${targetUser.tag} (${targetUser.id}) foi autorizado por ${interaction.user.tag} (${interaction.user.id})`);
      
      await interaction.reply({
        content: `✅ ${targetUser.toString()} foi autorizado a aprovar sugestões.`,
        ephemeral: false
      });
    } else {
      logger.error(`Guild ${guildId}: Erro ao autorizar usuário ${targetUser.tag} (${targetUser.id})`);
      
      await interaction.reply({
        content: `❌ Ocorreu um erro ao autorizar ${targetUser.toString()}.`,
        ephemeral: true
      });
    }
  })
};