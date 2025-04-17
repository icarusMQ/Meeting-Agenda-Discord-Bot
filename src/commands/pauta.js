const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAgenda, getSuggestions } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pauta')
    .setDescription('Exibe a pauta atual com itens aprovados'),
  
  execute: handleAsync(async (interaction) => {
    const agenda = getAgenda();
    const pendingSuggestions = getSuggestions();
    
    logger.info(`Pauta visualizada por ${interaction.user.tag} (${interaction.user.id})`);
    
    if (agenda.length === 0) {
      return interaction.reply({
        content: "📋 **Pauta da Reunião**\n\nNão há itens aprovados na pauta no momento.\n\n" + 
                 (pendingSuggestions.length > 0 ? 
                  `ℹ️ Existem ${pendingSuggestions.length} sugestões pendentes aguardando aprovação.` : 
                  "Use o comando `/sugerir` para adicionar uma sugestão à pauta."),
        ephemeral: false
      });
    }
    
    // Create an embed for the agenda
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📋 Pauta da Reunião')
      .setDescription('Abaixo estão os itens aprovados para a pauta atual:')
      .setTimestamp();
    
    // Add all agenda items to the embed
    agenda.forEach(item => {
      // Formatar a data de aprovação
      const approvalDate = new Date(item.approvedAt);
      const formattedDate = approvalDate.toLocaleDateString('pt-BR') + 
                           ' às ' + 
                           approvalDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      
      embed.addFields({
        name: `📌 Item #${item.id}`,
        value: `${item.text}\n👤 *Sugerido por: ${item.suggestedBy}*\n⏱️ *Aprovado em: ${formattedDate}*`
      });
    });
    
    // Add footer with count information
    let footerText = `Total: ${agenda.length} item(s) aprovado(s)`;
    
    if (pendingSuggestions.length > 0) {
      footerText += ` | ${pendingSuggestions.length} sugestão(ões) pendente(s)`;
    }
    
    embed.setFooter({ text: footerText });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
  })
};