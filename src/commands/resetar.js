const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetAgenda, resetSuggestions } = require('../utils/agenda');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetar')
    .setDescription('Reset manual da pauta e sugestões pendentes')
    .addBooleanOption(option =>
      option.setName('sugestoes')
        .setDescription('Resetar também as sugestões pendentes?')
        .setRequired(false)),
  
  async execute(interaction) {
    // Only users with admin permissions can reset the agenda
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para resetar a pauta. Apenas administradores podem usar este comando.',
        ephemeral: true
      });
    }
    
    // Reset the agenda
    resetAgenda();
    
    // Check if we should also reset suggestions
    const resetSugs = interaction.options.getBoolean('sugestoes');
    if (resetSugs) {
      resetSuggestions();
      return interaction.reply({
        content: '✅ A pauta foi resetada com sucesso! Todas as sugestões pendentes também foram removidas.',
        ephemeral: false
      });
    }
    
    return interaction.reply({
      content: '✅ A pauta foi resetada com sucesso! Sugestões pendentes foram mantidas.',
      ephemeral: false
    });
  },
};