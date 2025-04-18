const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAgenda } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pauta')
    .setDescription('Mostra os itens da pauta atual'),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Get the current agenda items for this guild
    const agenda = getAgenda(guildId);
    
    // Create an embed for the agenda
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📋 Pauta da Reunião')
      .setTimestamp();
    
    if (agenda.length === 0) {
      embed.setDescription('Não há itens na pauta atual. Use o comando `/sugerir` para sugerir um item.');
    } else {
      embed.setDescription(`Total de itens: ${agenda.length}`);
      
      // Add each agenda item to the embed
      agenda.forEach(item => {
        embed.addFields({
          name: `#${item.id}: ${item.text}`, 
          value: `Sugerido por: ${item.suggestedBy}`
        });
      });
    }
    
    // Send the embed
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
    
    logger.info(`Guild ${guildId}: Pauta visualizada por ${interaction.user.tag} (${interaction.user.id})`);
  })
};