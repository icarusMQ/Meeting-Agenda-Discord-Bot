// src/utils/agenda.js
/**
 * Utilitário de gerenciamento de pautas e sugestões para reuniões
 * Armazenamento em memória, considere migrar para banco de dados em produção
 */

const logger = require('./logger');

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
  logger.info(`Nova sugestão #${suggestion.id} adicionada por ${username} (${userId}): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
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
    logger.warn(`Tentativa de aprovar sugestão inexistente com ID ${id}`);
    return null;
  }
  
  const suggestion = suggestions[index];
  
  // Add to agenda
  const agendaItem = {
    id: agenda.length + 1,
    text: suggestion.text,
    suggestedBy: suggestion.username,
    suggestedById: suggestion.userId,
    approvedAt: new Date()
  };
  
  agenda.push(agendaItem);
  
  // Remove from pending suggestions
  suggestions.splice(index, 1);
  
  logger.info(`Sugestão #${id} aprovada e adicionada à pauta como item #${agendaItem.id}`);
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
 * @returns {boolean} True if reset was successful
 */
function resetAgenda() {
  if (agenda.length > 0) {
    // Save current agenda to history before resetting
    agendaHistory.push({
      items: [...agenda],
      archivedAt: new Date(),
      weekNumber: getWeekNumber(new Date())
    });
    
    logger.info(`Pauta resetada. ${agenda.length} itens movidos para o histórico.`);
    
    // Clean up old history (older than 1 month)
    const oldHistoryCount = agendaHistory.length;
    cleanupOldHistory();
    
    if (oldHistoryCount > agendaHistory.length) {
      logger.info(`Limpeza automática do histórico: ${oldHistoryCount - agendaHistory.length} pautas antigas removidas.`);
    }
    
    agenda = [];
    return true;
  } else {
    logger.info(`Pauta resetada, mas não havia itens para salvar no histórico.`);
    agenda = [];
    return true;
  }
}

/**
 * Reset suggestions
 * @returns {boolean} True if reset was successful
 */
function resetSuggestions() {
  const count = suggestions.length;
  suggestions = [];
  nextSuggestionId = 1;
  
  logger.info(`Sugestões resetadas. ${count} sugestões pendentes foram removidas.`);
  return true;
}

/**
 * Add a user to the authorized users list
 * @param {string} userId - The Discord user ID to authorize
 * @param {string} username - The username for display
 * @returns {boolean} True if user was added, false if already authorized
 */
function addAuthorizedUser(userId, username) {
  if (authorizedUsers.some(user => user.id === userId)) {
    logger.info(`Tentativa de autorizar usuário ${username} (${userId}) que já estava autorizado.`);
    return false;
  }
  
  authorizedUsers.push({
    id: userId,
    username,
    addedAt: new Date()
  });
  
  logger.info(`Usuário ${username} (${userId}) foi autorizado.`);
  return true;
}

/**
 * Remove a user from the authorized users list
 * @param {string} userId - The Discord user ID to remove
 * @returns {boolean} True if user was removed, false if not found
 */
function removeAuthorizedUser(userId) {
  const initialLength = authorizedUsers.length;
  const userToRemove = authorizedUsers.find(user => user.id === userId);
  
  authorizedUsers = authorizedUsers.filter(user => user.id !== userId);
  
  if (authorizedUsers.length < initialLength) {
    logger.info(`Usuário ${userToRemove ? userToRemove.username : userId} foi desautorizado.`);
    return true;
  } else {
    logger.warn(`Tentativa de desautorizar usuário ${userId} que não estava na lista.`);
    return false;
  }
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
  
  const oldCount = agendaHistory.length;
  agendaHistory = agendaHistory.filter(entry => entry.archivedAt > oneMonthAgo);
  
  if (oldCount > agendaHistory.length) {
    logger.debug(`Limpeza automática do histórico removeu ${oldCount - agendaHistory.length} entradas antigas.`);
  }
}

/**
 * Get the agenda history
 * @returns {Array} Historical agenda entries
 */
function getAgendaHistory() {
  return [...agendaHistory];
}

/**
 * Manually clear the entire agenda history
 * @returns {boolean} True if operation was successful
 */
function clearAgendaHistory() {
  const count = agendaHistory.length;
  agendaHistory = [];
  
  logger.info(`Todo o histórico de pautas foi limpo. ${count} pautas antigas foram removidas.`);
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