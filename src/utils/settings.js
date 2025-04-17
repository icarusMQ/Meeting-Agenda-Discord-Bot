// src/utils/settings.js
/**
 * Utility for storing and retrieving bot settings
 * In a production environment, consider using a database instead of in-memory storage
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Default settings
const defaultSettings = {
  // Day of the week for automatic agenda reset (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  resetDay: 0,
  // Hour of the day for automatic reset (0-23)
  resetHour: 0,
  // Minute of the hour for automatic reset (0-59)
  resetMinute: 0
};

// Current settings (starts with defaults)
let settings = { ...defaultSettings };

// Path to the settings file
const settingsFilePath = path.join(__dirname, '../../data/settings.json');

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory() {
  const dataDir = path.dirname(settingsFilePath);
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info(`Created data directory: ${dataDir}`);
    } catch (error) {
      logger.error(`Failed to create data directory: ${error.message}`, error);
    }
  }
}

/**
 * Load settings from file
 */
function loadSettings() {
  try {
    ensureDataDirectory();
    
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf8');
      const loadedSettings = JSON.parse(data);
      settings = { ...defaultSettings, ...loadedSettings };
      logger.info('Settings loaded successfully');
    } else {
      saveSettings(); // Create settings file with defaults
      logger.info('Created default settings file');
    }
  } catch (error) {
    logger.error(`Error loading settings: ${error.message}`, error);
  }
}

/**
 * Save settings to file
 */
function saveSettings() {
  try {
    ensureDataDirectory();
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    logger.info('Settings saved successfully');
    return true;
  } catch (error) {
    logger.error(`Error saving settings: ${error.message}`, error);
    return false;
  }
}

/**
 * Get a setting value
 * @param {string} key - The setting key
 * @param {any} defaultValue - Default value if setting doesn't exist
 * @returns {any} The setting value
 */
function getSetting(key, defaultValue = null) {
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

/**
 * Update a setting
 * @param {string} key - The setting key
 * @param {any} value - The new value
 * @returns {boolean} True if successful
 */
function updateSetting(key, value) {
  settings[key] = value;
  return saveSettings();
}

/**
 * Get the cron expression for the agenda reset
 * @returns {string} Cron expression (minute hour * * dayOfWeek)
 */
function getResetCronExpression() {
  const day = getSetting('resetDay', 0);
  const hour = getSetting('resetHour', 0);
  const minute = getSetting('resetMinute', 0);
  return `${minute} ${hour} * * ${day}`;
}

/**
 * Get the day name for a day number
 * @param {number} dayNumber - Day number (0-6)
 * @returns {string} Day name
 */
function getDayName(dayNumber) {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];
  
  const daysPortuguese = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  
  // Return both English and Portuguese names
  return {
    en: days[dayNumber],
    pt: daysPortuguese[dayNumber]
  };
}

// Initialize by loading settings
loadSettings();

module.exports = {
  loadSettings,
  getSetting,
  updateSetting,
  getResetCronExpression,
  getDayName
};