// scripts/deploy-commands.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes, PermissionFlagsBits } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');
fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const cmd = require(path.join(__dirname, '../src/commands', file));
    if (cmd.data && cmd.execute) {
      // Set default permissions for restricted commands
      if (file === 'aprovar.js' || file === 'autorizar.js' || file === 'desautorizar.js') {
        // These commands are only visible to administrators and users with the leader role
        cmd.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
      }
      commands.push(cmd.data.toJSON());
    }
  });

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    // First delete all existing commands to refresh
    console.log('🗑️ Removing existing slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: [] }
    );
    console.log('✅ Existing slash commands removed.');

    // Then register the current commands
    console.log('📡 Registering slash commands…');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands },
    );
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error(err);
  }
})();
