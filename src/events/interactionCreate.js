// src/events/interactionCreate.js
module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error('Error executing', interaction.commandName, err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ Erro ao executar comando.',
          flags: 64
        });
      } else {
        await interaction.reply({
          content: '❌ Erro ao executar comando.',
          flags: 64
        });
      }
    }
  },
};
