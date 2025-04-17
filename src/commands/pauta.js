const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAgenda, getSuggestions } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pauta')
    .setDescription('Exibe a pauta atual com itens aprovados'),
  
  async execute(interaction) {
    const agenda = getAgenda();
    const pendingSuggestions = getSuggestions();
    
    if (agenda.length === 0) {
      return interaction.reply({
        content: "📝 **Pauta da Reunião**\n\nNão há itens aprovados na pauta no momento.",
        ephemeral: false
      });
    }
    
    // Create an embed for the agenda
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📝 Pauta da Reunião')
      .setDescription('Abaixo estão os itens aprovados para a pauta atual:')
      .setTimestamp();
    
    // Add all agenda items to the embed
    agenda.forEach(item => {
      embed.addFields({
        name: `Item #${item.id}`,
        value: `${item.text}\n*Sugerido por: ${item.suggestedBy}*`
      });
    });
    
    // Add footer with count information
    embed.setFooter({ 
      text: `Total: ${agenda.length} item(s) aprovado(s) | ${pendingSuggestions.length} sugestão(ões) pendente(s)` 
    });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
  },
};