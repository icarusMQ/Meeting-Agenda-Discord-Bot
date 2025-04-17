// scripts/deploy-commands.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');
fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const cmd = require(path.join(__dirname, '../src/commands', file));
    if (cmd.data && cmd.execute) commands.push(cmd.data.toJSON());
  });

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
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
