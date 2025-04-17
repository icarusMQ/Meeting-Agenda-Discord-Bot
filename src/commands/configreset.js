const { SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { getSetting, updateSetting, getDayName } = require('../utils/settings');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configreset')
    .setDescription('Configurar dia e hora do reset automático da pauta')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only admin can use
    .addSubcommand(subcommand =>
      subcommand
        .setName('dia')
        .setDescription('Alterar o dia da semana em que a pauta é resetada automaticamente'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('hora')
        .setDescription('Alterar a hora em que a pauta é resetada')
        .addIntegerOption(option =>
          option.setName('hora')
          .setDescription('Hora do reset (0-23)')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(23))
        .addIntegerOption(option =>
          option.setName('minuto')
          .setDescription('Minuto do reset (0-59)')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(59)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Verificar a configuração atual do reset automático')),
  
  execute: handleAsync(async (interaction) => {
    // Apenas administradores podem alterar configurações
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      logger.info(`Usuário sem permissão tentou configurar reset: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não tem permissão para alterar as configurações do bot. Apenas administradores podem usar este comando.',
        ephemeral: true
      });
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    // Subcomando para verificar o status atual
    if (subcommand === 'status') {
      const resetDay = getSetting('resetDay', 0);
      const resetHour = getSetting('resetHour', 0);
      const resetMinute = getSetting('resetMinute', 0);
      const dayName = getDayName(resetDay);
      
      return interaction.reply({
        content: `⚙️ **Configuração de Reset Automático**\n\nA pauta é resetada automaticamente toda **${dayName.pt}** às **${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}**.\n\nUse \`/configreset dia\` para alterar o dia ou \`/configreset hora\` para alterar o horário.`,
        ephemeral: false
      });
    }
    
    // Subcomando para alterar a hora
    if (subcommand === 'hora') {
      const resetDay = getSetting('resetDay', 0);
      const dayName = getDayName(resetDay);
      const newHour = interaction.options.getInteger('hora');
      const newMinute = interaction.options.getInteger('minuto');
      
      // Atualizar configurações
      updateSetting('resetHour', newHour);
      updateSetting('resetMinute', newMinute);
      
      // Avisar sobre necessidade de reiniciar o bot
      logger.info(`Horário do reset alterado para ${newHour}:${newMinute} por ${interaction.user.tag} (${interaction.user.id})`);
      
      return interaction.reply({
        content: `✅ **Horário de Reset Atualizado**\n\nO horário do reset automático foi alterado para **${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}**.\n\nA pauta continuará sendo resetada toda **${dayName.pt}** neste novo horário.\n\n⚠️ **Nota:** Para que a alteração tenha efeito, o bot deve ser reiniciado.`,
        ephemeral: false
      });
    }
    
    // Subcomando para alterar o dia
    if (subcommand === 'dia') {
      // Criar menu de seleção para os dias da semana
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_reset_day')
        .setPlaceholder('Selecione o dia da semana')
        .addOptions([
          { label: 'Domingo', value: '0', description: 'Reset no início da semana' },
          { label: 'Segunda-feira', value: '1', description: 'Início da semana de trabalho' },
          { label: 'Terça-feira', value: '2' },
          { label: 'Quarta-feira', value: '3', description: 'Meio da semana' },
          { label: 'Quinta-feira', value: '4' },
          { label: 'Sexta-feira', value: '5', description: 'Fim da semana de trabalho' },
          { label: 'Sábado', value: '6', description: 'Fim de semana' }
        ]);
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      const currentResetDay = getSetting('resetDay', 0);
      const currentDayName = getDayName(currentResetDay);
      const resetHour = getSetting('resetHour', 0);
      const resetMinute = getSetting('resetMinute', 0);
      const formattedTime = `${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`;
      
      // Enviar mensagem com menu de seleção
      const response = await interaction.reply({
        content: `⚙️ **Alterar Dia do Reset**\n\nAtualmente a pauta é resetada toda **${currentDayName.pt}** às **${formattedTime}**.\n\nSelecione o novo dia da semana para o reset automático:`,
        components: [row],
        ephemeral: true,
        fetchReply: true
      });
      
      // Aguardar pela seleção
      try {
        const collected = await response.awaitMessageComponent({
          componentType: ComponentType.StringSelect,
          time: 60000, // 1 minuto para responder
        });
        
        const newDay = parseInt(collected.values[0], 10);
        const newDayName = getDayName(newDay);
        
        // Atualizar configuração
        updateSetting('resetDay', newDay);
        
        logger.info(`Dia do reset alterado para ${newDay} (${newDayName.pt}) por ${interaction.user.tag} (${interaction.user.id})`);
        
        await collected.update({
          content: `✅ **Dia de Reset Atualizado**\n\nO dia do reset automático foi alterado para **${newDayName.pt}** às **${formattedTime}**.\n\nA próxima pauta será resetada automaticamente neste novo dia.\n\n⚠️ **Nota:** Para que a alteração tenha efeito, o bot deve ser reiniciado.`,
          components: [],
          ephemeral: true
        });
        
        // Anunciar mudança no canal atual
        await interaction.channel.send({
          content: `📢 **Aviso: Alteração no Reset da Pauta**\n\n${interaction.user.toString()} alterou o dia do reset automático da pauta para **${newDayName.pt}** às **${formattedTime}**.`
        });
        
      } catch (error) {
        // Tempo expirado ou erro
        if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
          await interaction.editReply({
            content: '⏱️ Tempo para seleção expirado. Nenhuma alteração foi realizada.',
            components: [],
            ephemeral: true
          });
        } else {
          throw error; // Deixe o gerenciador de erros globais lidar com isso
        }
      }
    }
  })
};