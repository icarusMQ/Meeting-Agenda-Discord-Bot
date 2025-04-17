/**
 * Guild-specific settings management
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Default settings for all guilds
const defaultSettings = {
  resetDay: 0, // Sunday (0-6, where 0 is Sunday)
  resetHour: 0, // Midnight
  resetMinute: 0,
  notificationChannelId: null,
  language: 'pt-BR'
};

// Store settings for all guilds
let guildSettings = {};

// Path to store settings
const settingsPath = path.join(__dirname, '../../data/settings.json');

/**
 * Initialize settings by loading from file
 */
function initSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      guildSettings = JSON.parse(data);
      logger.info('Settings loaded successfully');
    } else {
      saveSettings();
      logger.info('Created new settings file');
    }
  } catch (error) {
    logger.error(`Error loading settings: ${error.message}`);
    guildSettings = {};
    saveSettings();
  }
}

/**
 * Save all guild settings to file
 */
function saveSettings() {
  try {
    const dataDir = path.dirname(settingsPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(guildSettings, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error(`Error saving settings: ${error.message}`);
    return false;
  }
}

/**
 * Ensure settings exist for a guild
 * @param {string} guildId - The Discord guild ID
 */
function ensureGuildSettings(guildId) {
  if (!guildSettings[guildId]) {
    guildSettings[guildId] = { ...defaultSettings };
    saveSettings();
  }
  return guildSettings[guildId];
}

/**
 * Get a setting value for a guild
 * @param {string} guildId - The Discord guild ID
 * @param {string} key - The setting key
 * @param {*} defaultValue - Default value if setting doesn't exist
 * @returns {*} The setting value
 */
function getSetting(guildId, key, defaultValue = null) {
  ensureGuildSettings(guildId);
  
  if (key in guildSettings[guildId]) {
    return guildSettings[guildId][key];
  }
  
  if (key in defaultSettings) {
    guildSettings[guildId][key] = defaultSettings[key];
    saveSettings();
    return defaultSettings[key];
  }
  
  return defaultValue;
}

/**
 * Update a setting for a guild
 * @param {string} guildId - The Discord guild ID
 * @param {string} key - The setting key
 * @param {*} value - The new value
 * @returns {boolean} True if setting was updated successfully
 */
function updateSetting(guildId, key, value) {
  ensureGuildSettings(guildId);
  
  guildSettings[guildId][key] = value;
  return saveSettings();
}

/**
 * Reset all settings for a guild to defaults
 * @param {string} guildId - The Discord guild ID
 * @returns {boolean} True if settings were reset successfully
 */
function resetSettings(guildId) {
  guildSettings[guildId] = { ...defaultSettings };
  return saveSettings();
}

/**
 * Get the cron expression for the reset schedule
 * @param {string} guildId - The Discord guild ID
 * @returns {string} The cron expression
 */
function getResetCronExpression(guildId) {
  const resetDay = getSetting(guildId, 'resetDay', 0);
  const resetHour = getSetting(guildId, 'resetHour', 0);
  const resetMinute = getSetting(guildId, 'resetMinute', 0);
  
  // Cron expression format: minute hour * * day-of-week
  // day-of-week: 0-6 (Sunday to Saturday)
  return `${resetMinute} ${resetHour} * * ${resetDay}`;
}

/**
 * Get the name of a day of the week
 * @param {number|string} day - Day of the week (0-6, where 0 is Sunday)
 * @returns {string} Name of the day in Portuguese
 */
function getDayName(day) {
  // Convert to number and validate
  const dayNum = Number(day);
  
  // Check if it's a valid number between 0-6
  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
    return 'Dia inválido';
  }
  
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  
  return days[dayNum];
}

// Initialize settings
initSettings();

module.exports = {
  getSetting,
  updateSetting,
  resetSettings,
  getResetCronExpression,
  getDayName
};