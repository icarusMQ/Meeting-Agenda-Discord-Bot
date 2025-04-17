// src/utils/errorHandler.js
const logger = require('./logger');

/**
 * Wrapper para tratamento de erros em comandos e eventos
 * @param {Function} fn - A função a ser envolvida com tratamento de erros
 * @returns {Function} - A função com tratamento de erros
 */
function handleAsync(fn) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      const interaction = args[0];
      logger.error(`Erro na execução: ${error.message}`, error);
      
      // Se houver uma interação, responda ao usuário de forma elegante
      if (interaction && interaction.reply && typeof interaction.reply === 'function') {
        try {
          // Verifica se a interação já foi respondida
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ Ocorreu um erro ao processar este comando. O erro foi registrado.',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ Ocorreu um erro ao processar este comando. O erro foi registrado.',
              ephemeral: true
            });
          }
        } catch (replyError) {
          logger.error(`Erro ao enviar mensagem de erro: ${replyError.message}`, replyError);
        }
      }
    }
  };
}

/**
 * Loga erros e informações de performance
 */
function setupGlobalErrorHandlers() {
  // Capturar exceções não tratadas
  process.on('uncaughtException', (error) => {
    logger.error('Exceção não tratada:', error);
    // Não desligar o processo em produção, apenas registrar
  });

  // Capturar promessas rejeitadas não tratadas
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promessa rejeitada não tratada:', reason);
  });

  // Registrar quando o processo estiver saindo
  process.on('exit', (code) => {
    logger.info(`Processo saindo com código: ${code}`);
  });
}

module.exports = {
  handleAsync,
  setupGlobalErrorHandlers
};