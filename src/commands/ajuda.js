const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { handleAsync } = require('../utils/errorHandler');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Exibe informações de ajuda sobre o bot e seus comandos'),
  
  execute: handleAsync(async (interaction) => {
    const embed = new EmbedBuilder()
      .setColor(0x4286f4)
      .setTitle('📋 Ajuda - Bot de Pautas')
      .setDescription('Este bot ajuda a gerenciar pautas de reuniões, permitindo sugestões e aprovações de itens.')
      .addFields(
        { 
          name: '🙋‍♂️ Comandos para Todos os Usuários', 
          value: 
          '`/pauta` - Visualizar a pauta atual\n' +
          '`/sugerir` - Enviar uma sugestão para a pauta\n' +
          '`/historico listar` - Ver pautas anteriores'
        },
        { 
          name: '🔑 Comandos para Usuários Autorizados', 
          value: 
          '`/aprovar` - Aprovar uma sugestão\n' +
          '`/autorizados` - Ver lista de usuários autorizados'
        },
        { 
          name: '👑 Comandos para Administradores', 
          value: 
          '`/autorizar` - Autorizar um usuário a aprovar sugestões\n' +
          '`/desautorizar` - Remover autorização de um usuário\n' +
          '`/resetar` - Resetar a pauta atual (salva no histórico)\n' +
          '`/historico limpar` - Limpar o histórico de pautas'
        }
      )
      .setFooter({ 
        text: 'A pauta é automaticamente resetada todo domingo à meia-noite' 
      });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
    
    logger.info(`Comando de ajuda utilizado por ${interaction.user.tag} (${interaction.user.id})`);
  })
};