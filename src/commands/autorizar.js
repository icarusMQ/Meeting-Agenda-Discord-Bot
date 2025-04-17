const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addAuthorizedUser } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorizar')
    .setDescription('Autoriza um usuário a aprovar sugestões de pauta')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que será autorizado a aprovar sugestões')
        .setRequired(true)),
  
  async execute(interaction) {
    // Only users with the leader role or administrators can add authorized users
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isLeader) {
      return interaction.reply({
        content: '❌ Você não tem permissão para autorizar outros usuários.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    
    // Add user to authorized list
    const success = addAuthorizedUser(targetUser.id, targetUser.username);
    
    if (success) {
      // Try to add the authorized role to the user
      try {
        const authorizedRole = interaction.guild.roles.cache.get(process.env.AUTHORIZED_ROLE_ID);
        if (authorizedRole) {
          await targetMember.roles.add(authorizedRole);
        }
      } catch (error) {
        console.error('Error adding role:', error);
        return interaction.reply({
          content: `✅ **${targetUser.username}** foi adicionado à lista de autorizados, mas não foi possível adicionar o papel. Verifique as permissões do bot ou se o AUTHORIZED_ROLE_ID está configurado corretamente.`,
          ephemeral: true
        });
      }
      
      return interaction.reply({
        content: `✅ **${targetUser.username}** agora está autorizado a aprovar sugestões de pauta.`,
        ephemeral: true
      });
    } else {
      return interaction.reply({
        content: `ℹ️ **${targetUser.username}** já está autorizado a aprovar sugestões.`,
        ephemeral: true
      });
    }
  },
};