/**
 * Guild-specific agenda management
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Path to store data
const dataDir = path.join(__dirname, '../../data');
const agendaDataDir = path.join(dataDir, 'guilds');

// In-memory data storage for all guilds
const guildsData = new Map();

/**
 * Initialize data structure for a guild if it doesn't exist
 * @param {string} guildId - The Discord guild ID
 */
function initGuildData(guildId) {
  if (!guildsData.has(guildId)) {
    guildsData.set(guildId, {
      agenda: [],
      suggestions: [],
      authorizedUsers: [],
      agendaHistory: [],
      nextAgendaId: 1,
      nextSuggestionId: 1
    });
    saveGuildData(guildId);
  }
  return guildsData.get(guildId);
}

/**
 * Save guild data to file
 * @param {string} guildId - The Discord guild ID
 */
function saveGuildData(guildId) {
  if (!guildsData.has(guildId)) return false;
  
  try {
    // Create directories if they don't exist
    if (!fs.existsSync(agendaDataDir)) {
      fs.mkdirSync(agendaDataDir, { recursive: true });
    }
    
    const filePath = path.join(agendaDataDir, `${guildId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(guildsData.get(guildId), null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error(`Error saving data for guild ${guildId}: ${error.message}`);
    return false;
  }
}

/**
 * Load guild data from file
 * @param {string} guildId - The Discord guild ID
 */
function loadGuildData(guildId) {
  try {
    const filePath = path.join(agendaDataDir, `${guildId}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      guildsData.set(guildId, JSON.parse(data));
      return true;
    } else {
      // Initialize new guild data if file doesn't exist
      initGuildData(guildId);
      return true;
    }
  } catch (error) {
    logger.error(`Error loading data for guild ${guildId}: ${error.message}`);
    initGuildData(guildId);
    return false;
  }
}

/**
 * Get the current agenda items for a guild
 * @param {string} guildId - The Discord guild ID
 * @returns {Array} List of agenda items
 */
function getAgenda(guildId) {
  ensureGuildData(guildId);
  return guildsData.get(guildId).agenda;
}

/**
 * Get the list of suggestions for a guild
 * @param {string} guildId - The Discord guild ID
 * @returns {Array} List of suggestions
 */
function getSuggestions(guildId) {
  ensureGuildData(guildId);
  return guildsData.get(guildId).suggestions;
}

/**
 * Get the authorized users for a guild
 * @param {string} guildId - The Discord guild ID
 * @returns {Array} List of authorized users
 */
function getAuthorizedUsers(guildId) {
  ensureGuildData(guildId);
  return guildsData.get(guildId).authorizedUsers;
}

/**
 * Get the agenda history for a guild
 * @param {string} guildId - The Discord guild ID
 * @returns {Array} List of historical agenda entries
 */
function getAgendaHistory(guildId) {
  ensureGuildData(guildId);
  return guildsData.get(guildId).agendaHistory;
}

/**
 * Check if a user is authorized
 * @param {string} guildId - The Discord guild ID
 * @param {string} userId - The Discord user ID
 * @returns {boolean} True if user is authorized
 */
function isUserAuthorized(guildId, userId) {
  ensureGuildData(guildId);
  const authorizedUsers = guildsData.get(guildId).authorizedUsers;
  return authorizedUsers.some(user => user.id === userId);
}

/**
 * Add a user to the authorized list
 * @param {string} guildId - The Discord guild ID
 * @param {string} userId - The Discord user ID
 * @param {string} username - The Discord username
 * @returns {boolean} True if user was added successfully
 */
function addAuthorizedUser(guildId, userId, username) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  // Check if already authorized
  if (isUserAuthorized(guildId, userId)) {
    return false;
  }
  
  guildData.authorizedUsers.push({
    id: userId,
    username: username,
    addedAt: new Date().toISOString()
  });
  
  return saveGuildData(guildId);
}

/**
 * Remove a user from the authorized list
 * @param {string} guildId - The Discord guild ID
 * @param {string} userId - The Discord user ID
 * @returns {boolean} True if user was removed successfully
 */
function removeAuthorizedUser(guildId, userId) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  const initialLength = guildData.authorizedUsers.length;
  guildData.authorizedUsers = guildData.authorizedUsers.filter(user => user.id !== userId);
  
  if (guildData.authorizedUsers.length < initialLength) {
    return saveGuildData(guildId);
  }
  
  return false;
}

/**
 * Add a suggestion to the list
 * @param {string} guildId - The Discord guild ID
 * @param {string} text - The suggestion text
 * @param {string} userId - The Discord user ID
 * @param {string} username - The Discord username
 * @returns {Object} The created suggestion
 */
function addSuggestion(guildId, text, userId, username) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  const suggestion = {
    id: guildData.nextSuggestionId++,
    text: text,
    userId: userId,
    username: username,
    createdAt: new Date().toISOString()
  };
  
  guildData.suggestions.push(suggestion);
  saveGuildData(guildId);
  
  return suggestion;
}

/**
 * Approve a suggestion and add it to the agenda
 * @param {string} guildId - The Discord guild ID
 * @param {number} suggestionId - The suggestion ID
 * @returns {Object|null} The approved item or null if not found
 */
function approveSuggestion(guildId, suggestionId) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  // Find the suggestion
  const suggestionIndex = guildData.suggestions.findIndex(s => s.id === suggestionId);
  if (suggestionIndex === -1) {
    return null;
  }
  
  const suggestion = guildData.suggestions[suggestionIndex];
  
  // Add to agenda
  const agendaItem = {
    id: guildData.nextAgendaId++,
    text: suggestion.text,
    suggestedBy: suggestion.username,
    userId: suggestion.userId,
    approvedAt: new Date().toISOString(),
    suggestionId: suggestion.id
  };
  
  guildData.agenda.push(agendaItem);
  
  // Remove from suggestions
  guildData.suggestions.splice(suggestionIndex, 1);
  
  saveGuildData(guildId);
  
  return agendaItem;
}

/**
 * Reset the agenda and move current items to history
 * @param {string} guildId - The Discord guild ID
 * @returns {boolean} True if successful
 */
function resetAgenda(guildId) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  // Move current agenda to history
  if (guildData.agenda.length > 0) {
    const historyEntry = {
      items: [...guildData.agenda],
      archivedAt: new Date().toISOString(),
      weekNumber: getWeekNumber()
    };
    
    guildData.agendaHistory.push(historyEntry);
    guildData.agenda = [];
    
    return saveGuildData(guildId);
  }
  
  return true;
}

/**
 * Reset all suggestions for a guild
 * @param {string} guildId - The Discord guild ID
 * @returns {boolean} True if successful
 */
function resetSuggestions(guildId) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  guildData.suggestions = [];
  return saveGuildData(guildId);
}

/**
 * Clear the agenda history for a guild
 * @param {string} guildId - The Discord guild ID
 * @returns {boolean} True if successful
 */
function clearAgendaHistory(guildId) {
  ensureGuildData(guildId);
  const guildData = guildsData.get(guildId);
  
  guildData.agendaHistory = [];
  return saveGuildData(guildId);
}

/**
 * Get the current week number
 * @returns {number} Week number (1-53)
 */
function getWeekNumber() {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Ensure guild data is loaded
 * @param {string} guildId - The Discord guild ID
 */
function ensureGuildData(guildId) {
  if (!guildsData.has(guildId)) {
    loadGuildData(guildId);
  }
  return guildsData.get(guildId);
}

/**
 * Load all guild data during startup
 */
function loadAllGuildData() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(agendaDataDir)) {
      fs.mkdirSync(agendaDataDir, { recursive: true });
      return;
    }
    
    // Read all guild files and load data
    const files = fs.readdirSync(agendaDataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const guildId = file.replace('.json', '');
        loadGuildData(guildId);
        logger.info(`Loaded data for guild ${guildId}`);
      }
    }
  } catch (error) {
    logger.error(`Error loading guild data: ${error.message}`);
  }
}

// Load all guild data on startup
loadAllGuildData();

module.exports = {
  getAgenda,
  getSuggestions,
  getAuthorizedUsers,
  getAgendaHistory,
  isUserAuthorized,
  addAuthorizedUser,
  removeAuthorizedUser,
  addSuggestion,
  approveSuggestion,
  resetAgenda,
  resetSuggestions,
  clearAgendaHistory
};