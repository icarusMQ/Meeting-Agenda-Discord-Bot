const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getAgendaHistory, clearAgendaHistory } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historico')
    .setDescription('Exibe o histórico de pautas anteriores')
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Listar o histórico de pautas anteriores'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('limpar')
        .setDescription('Limpar todo o histórico de pautas (apenas administradores)')),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'limpar') {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Você não tem permissão para limpar o histórico. Apenas administradores podem usar este comando.',
          ephemeral: true
        });
      }
      
      // Clear the history
      clearAgendaHistory();
      
      return interaction.reply({
        content: '✅ O histórico de pautas foi limpo com sucesso!',
        ephemeral: false
      });
    }
    
    // Default: list history
    const history = getAgendaHistory();
    
    if (history.length === 0) {
      return interaction.reply({
        content: "📚 **Histórico de Pautas**\n\nNão há pautas anteriores no histórico.",
        ephemeral: false
      });
    }
    
    // Sort history by date (newest first)
    history.sort((a, b) => b.archivedAt - a.archivedAt);
    
    // Create an embed for the history
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📚 Histórico de Pautas')
      .setDescription('Abaixo estão as pautas anteriores (mais recentes primeiro):')
      .setTimestamp();
    
    // Add each historical agenda to the embed
    for (const entry of history) {
      const date = new Date(entry.archivedAt);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - Semana ${entry.weekNumber}`;
      
      let itemsList = '';
      entry.items.forEach(item => {
        itemsList += `• ${item.text} (por ${item.suggestedBy})\n`;
      });
      
      embed.addFields({
        name: `📅 Pauta de ${formattedDate}`,
        value: itemsList || 'Nenhum item na pauta'
      });
    }
    
    // Add footer with count information
    embed.setFooter({ 
      text: `Total: ${history.length} pauta(s) no histórico | Histórico é mantido por 1 mês` 
    });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
  },
};