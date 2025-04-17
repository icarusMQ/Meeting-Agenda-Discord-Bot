const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAuthorizedUsers } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorizados')
    .setDescription('Mostra a lista de usuários autorizados a aprovar sugestões'),
  
  async execute(interaction) {
    const authorizedUsers = getAuthorizedUsers();
    
    if (authorizedUsers.length === 0) {
      return interaction.reply({
        content: 'ℹ️ Não há usuários autorizados além dos líderes e administradores.',
        ephemeral: true
      });
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Usuários Autorizados')
      .setDescription('Usuários que podem aprovar sugestões de pauta:')
      .addFields(
        authorizedUsers.map(user => ({
          name: user.username,
          value: `ID: ${user.id} | Autorizado em: ${user.addedAt.toLocaleString()}`
        }))
      )
      .setTimestamp();
    
    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  },
};