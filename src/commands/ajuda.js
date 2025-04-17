const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { handleAsync } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const settings = require('../utils/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Exibe informações de ajuda sobre o bot e seus comandos'),
  
  execute: handleAsync(async (interaction) => {
    // Get guild ID from the interaction
    const guildId = interaction.guildId;
    
    // Obter informações do reset atual para exibir no rodapé
    const resetDay = settings.getSetting(guildId, 'resetDay', 0);
    const resetHour = settings.getSetting(guildId, 'resetHour', 0);
    const resetMinute = settings.getSetting(guildId, 'resetMinute', 0);
    
    // Get day name safely
    let dayName = 'Domingo'; // Default
    try {
      // Get the day name directly as string, not as object
      dayName = settings.getDayName(resetDay);
    } catch (error) {
      logger.error(`Error getting day name for day ${resetDay}: ${error.message}`);
    }
    
    const formattedTime = `${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`;
    
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
          '`/resetar` - Resetar a pauta atual manualmente (salva no histórico)\n' +
          '`/historico limpar` - Limpar o histórico de pautas\n' + 
          '`/configreset` - Configurar o dia e hora do reset automático'
        },
        {
          name: '⚙️ Configurações de Reset',
          value:
          '`/configreset status` - Ver a configuração atual do reset\n' +
          '`/configreset dia` - Alterar o dia do reset automático\n' +
          '`/configreset hora` - Alterar o horário do reset automático'
        }
      )
      .setFooter({ 
        text: `A pauta é automaticamente resetada toda ${dayName} às ${formattedTime}` 
      });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
    
    logger.info(`Comando de ajuda utilizado por ${interaction.user.tag} (${interaction.user.id})`);
  })
};