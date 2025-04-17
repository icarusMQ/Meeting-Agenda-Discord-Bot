const { SlashCommandBuilder } = require('discord.js');
const { addSuggestion } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerir')
    .setDescription('Sugere um item para a pauta')
    .addStringOption(option => 
      option.setName('texto')
            .setDescription('O texto a ser adicionado na pauta')
            .setRequired(true)),
  
  async execute(interaction) {
    const text = interaction.options.getString('texto');
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    const suggestion = addSuggestion(text, userId, username);
    
    await interaction.reply({
      content: `✅ Sugestão #${suggestion.id} registrada!\n📝 **${text}**\n\nAguardando aprovação.`,
      ephemeral: false
    });
  },
};