const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { removeAuthorizedUser, getAuthorizedUsers } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desautorizar')
    .setDescription('Remove a autorização de um usuário para aprovar sugestões')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que terá a autorização removida')
        .setRequired(true)),
  
  async execute(interaction) {
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
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    
    // Remove user from authorized list
    const success = removeAuthorizedUser(targetUser.id);
    
    if (success) {
      // Try to remove the authorized role from the user
      try {
        const authorizedRole = interaction.guild.roles.cache.get(process.env.AUTHORIZED_ROLE_ID);
        if (authorizedRole && targetMember.roles.cache.has(process.env.AUTHORIZED_ROLE_ID)) {
          await targetMember.roles.remove(authorizedRole);
        }
      } catch (error) {
        console.error('Error removing role:', error);
        return interaction.reply({
          content: `✅ **${targetUser.username}** foi removido da lista de autorizados, mas não foi possível remover o papel. Verifique as permissões do bot.`,
          ephemeral: true
        });
      }
      
      return interaction.reply({
        content: `✅ **${targetUser.username}** não está mais autorizado a aprovar sugestões.`,
        ephemeral: true
      });
    } else {
      return interaction.reply({
        content: `ℹ️ **${targetUser.username}** não estava na lista de usuários autorizados.`,
        ephemeral: true
      });
    }
  },
};