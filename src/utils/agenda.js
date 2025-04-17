// src/utils/agenda.js
/**
 * Simple in-memory storage for agenda items
 * In a production environment, consider using a database
 */

// Store agenda items
let agenda = [];
// Store pending suggestions
let suggestions = [];
// Counter for suggestion IDs
let nextSuggestionId = 1;
// Store authorized users (users who can approve suggestions)
let authorizedUsers = [];
// Store historical agendas
let agendaHistory = [];

/**
 * Add a new suggestion to the pending list
 * @param {string} text - The suggestion text
 * @param {string} userId - The user ID who suggested
 * @param {string} username - The username who suggested
 * @returns {Object} The created suggestion
 */
function addSuggestion(text, userId, username) {
  const suggestion = {
    id: nextSuggestionId++,
    text,
    userId,
    username,
    timestamp: new Date()
  };
  
  suggestions.push(suggestion);
  return suggestion;
}

/**
 * Approve a suggestion and add it to the agenda
 * @param {number} id - The suggestion ID to approve
 * @returns {Object|null} The approved suggestion or null if not found
 */
function approveSuggestion(id) {
  const index = suggestions.findIndex(s => s.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const suggestion = suggestions[index];
  
  // Add to agenda
  agenda.push({
    id: agenda.length + 1,
    text: suggestion.text,
    suggestedBy: suggestion.username,
    approvedAt: new Date()
  });
  
  // Remove from pending suggestions
  suggestions.splice(index, 1);
  
  return suggestion;
}

/**
 * Get all approved agenda items
 * @returns {Array} The approved agenda items
 */
function getAgenda() {
  return [...agenda];
}

/**
 * Get all pending suggestions
 * @returns {Array} The pending suggestions
 */
function getSuggestions() {
  return [...suggestions];
}

/**
 * Reset the agenda (e.g., weekly) and save to history
 */
function resetAgenda() {
  if (agenda.length > 0) {
    // Save current agenda to history before resetting
    agendaHistory.push({
      items: [...agenda],
      archivedAt: new Date(),
      weekNumber: getWeekNumber(new Date())
    });
    
    // Clean up old history (older than 1 month)
    cleanupOldHistory();
  }
  
  agenda = [];
}

/**
 * Reset suggestions
 */
function resetSuggestions() {
  suggestions = [];
  nextSuggestionId = 1;
}

/**
 * Add a user to the authorized users list
 * @param {string} userId - The Discord user ID to authorize
 * @param {string} username - The username for display
 * @returns {boolean} True if user was added, false if already authorized
 */
function addAuthorizedUser(userId, username) {
  if (authorizedUsers.some(user => user.id === userId)) {
    return false;
  }
  
  authorizedUsers.push({
    id: userId,
    username,
    addedAt: new Date()
  });
  
  return true;
}

/**
 * Remove a user from the authorized users list
 * @param {string} userId - The Discord user ID to remove
 * @returns {boolean} True if user was removed, false if not found
 */
function removeAuthorizedUser(userId) {
  const initialLength = authorizedUsers.length;
  authorizedUsers = authorizedUsers.filter(user => user.id !== userId);
  
  return authorizedUsers.length < initialLength;
}

/**
 * Check if a user is authorized to approve suggestions
 * @param {string} userId - The Discord user ID to check
 * @returns {boolean} True if user is authorized
 */
function isUserAuthorized(userId) {
  return authorizedUsers.some(user => user.id === userId);
}

/**
 * Get all authorized users
 * @returns {Array} The list of authorized users
 */
function getAuthorizedUsers() {
  return [...authorizedUsers];
}

/**
 * Get the week number for a date
 * @param {Date} date - The date to get the week number for
 * @returns {number} The week number
 */
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Clean up history items older than 1 month
 */
function cleanupOldHistory() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  agendaHistory = agendaHistory.filter(entry => entry.archivedAt > oneMonthAgo);
}

/**
 * Get the agenda history
 * @returns {Array} Historical agenda entries
 */
function getAgendaHistory() {
  return [...agendaHistory];
}

/**
 * Manually clean the entire agenda history
 */
function clearAgendaHistory() {
  agendaHistory = [];
  return true;
}

module.exports = {
  addSuggestion,
  approveSuggestion,
  getAgenda,
  getSuggestions,
  resetAgenda,
  resetSuggestions,
  addAuthorizedUser,
  removeAuthorizedUser,
  isUserAuthorized,
  getAuthorizedUsers,
  getAgendaHistory,
  clearAgendaHistory
};