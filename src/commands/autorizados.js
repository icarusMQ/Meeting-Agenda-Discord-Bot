const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAuthorizedUsers, isUserAuthorized } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorizados')
    .setDescription('Lista os usuários autorizados a aprovar sugestões'),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Get a list of authorized users for this guild
    const authorizedUsers = getAuthorizedUsers(guildId);
    
    // Create an embed to display the authorized users
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('👑 Usuários Autorizados')
      .setDescription('Os seguintes usuários estão autorizados a aprovar sugestões de pauta:')
      .setTimestamp();
    
    if (authorizedUsers.length === 0) {
      embed.setDescription('Não há usuários explicitamente autorizados no momento.\n\nAdministradores e usuários com o papel especificado em LEADER_ROLE_ID ou AUTHORIZED_ROLE_ID podem aprovar sugestões automaticamente.');
    } else {
      authorizedUsers.forEach(user => {
        const addedDate = new Date(user.addedAt);
        const formattedDate = addedDate.toLocaleDateString('pt-BR');
        
        embed.addFields({ 
          name: user.username, 
          value: `ID: ${user.id}\nAutorizado desde: ${formattedDate}`,
          inline: true
        });
      });
    }
    
    // Add information about the requester
    const isUserAuth = isUserAuthorized(guildId, interaction.user.id);
    const hasLeaderRole = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID);
    const hasAuthorizedRole = interaction.member.roles.cache.has(process.env.AUTHORIZED_ROLE_ID);
    const isAdmin = interaction.member.permissions.has('Administrator');
    
    let userStatus = "❌ Você **não** está autorizado a aprovar sugestões.";
    
    if (isUserAuth) {
      userStatus = "✅ Você está **explicitamente autorizado** a aprovar sugestões.";
    } else if (isAdmin) {
      userStatus = "✅ Você está autorizado a aprovar sugestões por ser um **Administrador**.";
    } else if (hasLeaderRole) {
      userStatus = `✅ Você está autorizado a aprovar sugestões por ter o papel de **Líder** (ID: ${process.env.LEADER_ROLE_ID}).`;
    } else if (hasAuthorizedRole) {
      userStatus = `✅ Você está autorizado a aprovar sugestões por ter o papel **Autorizado** (ID: ${process.env.AUTHORIZED_ROLE_ID}).`;
    }
    
    embed.setFooter({ text: userStatus });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
    
    logger.info(`Guild ${guildId}: Lista de usuários autorizados visualizada por ${interaction.user.tag} (${interaction.user.id})`);
  })
};