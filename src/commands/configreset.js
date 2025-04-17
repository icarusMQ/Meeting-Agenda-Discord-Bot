const { SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, EmbedBuilder } = require('discord.js');
const { updateSetting, resetSettings, getDayName, getSetting } = require('../utils/settings');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configreset')
    .setDescription('Configura ou reseta o dia/hora de reset da pauta')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand => 
      subcommand
        .setName('configurar')
        .setDescription('Configura o dia e hora de reset da pauta'))
    .addSubcommand(subcommand => 
      subcommand
        .setName('resetar')
        .setDescription('Reseta as configurações para o padrão'))
    .addSubcommand(subcommand => 
      subcommand
        .setName('status')
        .setDescription('Ver a configuração atual do reset')),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'status') {
      // Get current configuration
      const resetDay = getSetting(guildId, 'resetDay', 0);
      const resetHour = getSetting(guildId, 'resetHour', 0);
      const resetMinute = getSetting(guildId, 'resetMinute', 0);
      const notificationChannelId = getSetting(guildId, 'notificationChannelId', null);
      
      const dayName = getDayName(resetDay);
      const formattedTime = `${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`;
      
      // Create embed for showing status
      const embed = new EmbedBuilder()
        .setColor(0x4286f4)
        .setTitle('⚙️ Configuração de Reset da Pauta')
        .addFields(
          { name: 'Dia da Semana', value: dayName, inline: true },
          { name: 'Horário', value: formattedTime, inline: true },
          { 
            name: 'Canal de Notificação', 
            value: notificationChannelId ? `<#${notificationChannelId}>` : 'Não configurado', 
            inline: true 
          }
        )
        .setFooter({ text: 'Use /configreset configurar para alterar estas configurações' });
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === 'resetar') {
      // Confirm before resetting
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_reset_settings')
        .setLabel('Confirmar Reset')
        .setStyle(ButtonStyle.Danger);
        
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_reset_settings')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary);
        
      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
      
      const response = await interaction.reply({
        content: '⚠️ **Atenção**\n\nIsso irá resetar todas as configurações do bot para os valores padrão.\n\nDeseja continuar?',
        components: [row],
        ephemeral: true,
        fetchReply: true
      });
      
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000
      });
      
      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: '❌ Estes botões não são para você.',
            ephemeral: true
          });
        }
        
        await i.update({ components: [] });
        
        if (i.customId === 'cancel_reset_settings') {
          await i.editReply({
            content: 'Operação cancelada. As configurações não foram alteradas.',
            ephemeral: true
          });
          return;
        }
        
        if (i.customId === 'confirm_reset_settings') {
          const success = resetSettings(guildId);
          
          if (success) {
            logger.info(`Guild ${guildId}: Configurações resetadas por ${interaction.user.tag} (${interaction.user.id})`);
            
            await i.editReply({
              content: '✅ Todas as configurações foram resetadas para os valores padrão.',
              ephemeral: true
            });
          } else {
            await i.editReply({
              content: '❌ Ocorreu um erro ao resetar as configurações.',
              ephemeral: true
            });
          }
        }
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({
            content: '⏱️ Tempo esgotado. Nenhuma alteração foi realizada.',
            components: [],
            ephemeral: true
          });
        }
      });
    } else if (subcommand === 'configurar') {
      // Create day selection menu
      const daySelect = new StringSelectMenuBuilder()
        .setCustomId('reset_day')
        .setPlaceholder('Selecione o dia da semana')
        .addOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel('Domingo')
            .setValue('0')
            .setDescription('Reset ocorre todo domingo'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Segunda-feira')
            .setValue('1')
            .setDescription('Reset ocorre toda segunda-feira'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Terça-feira')
            .setValue('2')
            .setDescription('Reset ocorre toda terça-feira'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Quarta-feira')
            .setValue('3')
            .setDescription('Reset ocorre toda quarta-feira'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Quinta-feira')
            .setValue('4')
            .setDescription('Reset ocorre toda quinta-feira'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Sexta-feira')
            .setValue('5')
            .setDescription('Reset ocorre toda sexta-feira'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Sábado')
            .setValue('6')
            .setDescription('Reset ocorre todo sábado')
        ]);
      
      // Create hour selection menu
      const hourSelect = new StringSelectMenuBuilder()
        .setCustomId('reset_hour')
        .setPlaceholder('Selecione a hora')
        .addOptions(
          Array.from({ length: 24 }, (_, i) => 
            new StringSelectMenuOptionBuilder()
              .setLabel(`${i}:00`)
              .setValue(i.toString())
              .setDescription(`Reset ocorre às ${i}:00`)
          )
        );
      
      const dayRow = new ActionRowBuilder().addComponents(daySelect);
      const hourRow = new ActionRowBuilder().addComponents(hourSelect);
      
      const response = await interaction.reply({
        content: '⚙️ **Configuração de Reset**\n\nSelecione o dia da semana e a hora em que a pauta será resetada automaticamente.',
        components: [dayRow, hourRow],
        ephemeral: true,
        fetchReply: true
      });
      
      // Object to store selections
      const selections = {
        day: null,
        hour: null
      };
      
      // Check if both day and hour were selected
      const checkComplete = async (i) => {
        if (selections.day !== null && selections.hour !== null) {
          const dayName = getDayName(parseInt(selections.day));
          
          try {
            await i.update({
              content: `✅ **Configuração Completa**\n\nA pauta será resetada todo(a) **${dayName}** às **${selections.hour}:00**.\n\nEsta configuração é específica para este servidor.`,
              components: [],
              ephemeral: true
            });
          } catch (error) {
            if (error.code !== 'InteractionAlreadyReplied') {
              throw error;
            }
            
            // If already replied, use editReply instead
            await i.editReply({
              content: `✅ **Configuração Completa**\n\nA pauta será resetada todo(a) **${dayName}** às **${selections.hour}:00**.\n\nEsta configuração é específica para este servidor.`,
              components: [],
              ephemeral: true
            });
          }
          
          // Update settings for this guild
          updateSetting(guildId, 'resetDay', parseInt(selections.day));
          updateSetting(guildId, 'resetHour', parseInt(selections.hour));
          updateSetting(guildId, 'resetMinute', 0);
          
          logger.info(`Guild ${guildId}: Configuração de reset atualizada por ${interaction.user.tag} (${interaction.user.id}): dia ${selections.day}, hora ${selections.hour}`);
        }
      };
      
      // Collector for components
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000 // 1 minuto para selecionar
      });
      
      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: '❌ Estes menus não são para você.',
            ephemeral: true
          });
        }
        
        if (i.customId === 'reset_day') {
          selections.day = i.values[0];
          await i.update({
            content: `⚙️ **Configuração de Reset**\n\nDia selecionado: **${getDayName(parseInt(selections.day))}**\n\n${selections.hour !== null ? `Hora selecionada: **${selections.hour}:00**` : 'Agora selecione a hora.'}`,
            components: [dayRow, hourRow],
            ephemeral: true
          });
        } else if (i.customId === 'reset_hour') {
          selections.hour = i.values[0];
          await i.update({
            content: `⚙️ **Configuração de Reset**\n\n${selections.day !== null ? `Dia selecionado: **${getDayName(parseInt(selections.day))}**` : 'Selecione um dia da semana.'}\n\nHora selecionada: **${selections.hour}:00**`,
            components: [dayRow, hourRow],
            ephemeral: true
          });
        }
        
        await checkComplete(i);
      });
      
      collector.on('end', collected => {
        if (collected.size === 0 || (selections.day === null || selections.hour === null)) {
          interaction.editReply({
            content: '⏱️ Tempo esgotado ou configuração incompleta. Nenhuma alteração foi realizada.',
            components: [],
            ephemeral: true
          });
        }
      });
    }
  })
};