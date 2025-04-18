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
    } 
    else if (subcommand === 'resetar') {
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
      
      // Enviar mensagem de confirmação
      await interaction.reply({
        content: '⚠️ **Atenção**\n\nIsso irá resetar todas as configurações do bot para os valores padrão.\n\nDeseja continuar?',
        components: [row],
        ephemeral: true
      });
      
      // Criar filtro para interações
      const filter = i => {
        if (i.user.id !== interaction.user.id) {
          i.reply({
            content: '❌ Estes botões não são para você.',
            ephemeral: true
          });
          return false;
        }
        return true;
      };
      
      try {
        // Aguardar interação do usuário
        const buttonInteraction = await interaction.channel.awaitMessageComponent({
          filter,
          componentType: ComponentType.Button,
          time: 30000 // 30 segundos para responder
        });
        
        // Remover os botões
        await buttonInteraction.update({ components: [] });
        
        if (buttonInteraction.customId === 'cancel_reset_settings') {
          await buttonInteraction.editReply({
            content: 'Operação cancelada. As configurações não foram alteradas.'
          });
          return;
        }
        
        if (buttonInteraction.customId === 'confirm_reset_settings') {
          const success = resetSettings(guildId);
          
          if (success) {
            logger.info(`Guild ${guildId}: Configurações resetadas por ${interaction.user.tag} (${interaction.user.id})`);
            
            await buttonInteraction.editReply({
              content: '✅ Todas as configurações foram resetadas para os valores padrão.'
            });
          } else {
            await buttonInteraction.editReply({
              content: '❌ Ocorreu um erro ao resetar as configurações.'
            });
          }
        }
      } catch (error) {
        // Timeout ou erro
        if (error.code === 'InteractionCollectorError') {
          await interaction.editReply({
            content: '⏱️ Tempo esgotado. Nenhuma alteração foi realizada.',
            components: []
          });
        } else {
          logger.error(`Erro ao processar interação: ${error.message}`, error);
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao processar sua solicitação.',
            components: []
          });
        }
      }
    } 
    else if (subcommand === 'configurar') {
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
      
      // Object to store selections
      const selections = {
        day: null,
        hour: null
      };
      
      // Enviar os menus de seleção
      await interaction.reply({
        content: '⚙️ **Configuração de Reset**\n\nSelecione o dia da semana e a hora em que a pauta será resetada automaticamente.',
        components: [dayRow, hourRow],
        ephemeral: true
      });
      
      // Criar filtro para interações
      const filter = i => {
        if (i.user.id !== interaction.user.id) {
          i.reply({
            content: '❌ Estes menus não são para você.',
            ephemeral: true
          });
          return false;
        }
        return true;
      };
      
      // Função para verificar se a configuração está completa e aplicar as alterações
      const applySettings = () => {
        if (selections.day !== null && selections.hour !== null) {
          const dayName = getDayName(parseInt(selections.day));
          
          // Update settings for this guild
          updateSetting(guildId, 'resetDay', parseInt(selections.day));
          updateSetting(guildId, 'resetHour', parseInt(selections.hour));
          updateSetting(guildId, 'resetMinute', 0);
          
          logger.info(`Guild ${guildId}: Configuração de reset atualizada por ${interaction.user.tag} (${interaction.user.id}): dia ${selections.day}, hora ${selections.hour}`);
          
          return true;
        }
        return false;
      };
      
      // Definir um timeout para o coletor
      const collector_end_time = Date.now() + 60000; // 1 minuto
      
      // Processamento de seleções - estratégia de loop para coleção múltipla
      try {
        let configComplete = false;
        while (Date.now() < collector_end_time && !configComplete) {
          // Esperar pela próxima interação
          const selectInteraction = await interaction.channel.awaitMessageComponent({
            filter,
            componentType: ComponentType.StringSelect,
            time: collector_end_time - Date.now() // Tempo restante
          });
          
          if (selectInteraction.customId === 'reset_day') {
            selections.day = selectInteraction.values[0];
            
            // Verificar se ambas as seleções foram feitas
            if (selections.hour !== null) {
              const dayName = getDayName(parseInt(selections.day));
              await selectInteraction.update({
                content: `✅ **Configuração Completa**\n\nA pauta será resetada todo(a) **${dayName}** às **${selections.hour}:00**.\n\nEsta configuração é específica para este servidor.`,
                components: [],
              });
              configComplete = applySettings();
            } else {
              await selectInteraction.update({
                content: `⚙️ **Configuração de Reset**\n\nDia selecionado: **${getDayName(parseInt(selections.day))}**\n\nAgora selecione a hora.`,
                components: [dayRow, hourRow]
              });
            }
          } else if (selectInteraction.customId === 'reset_hour') {
            selections.hour = selectInteraction.values[0];
            
            // Verificar se ambas as seleções foram feitas
            if (selections.day !== null) {
              const dayName = getDayName(parseInt(selections.day));
              await selectInteraction.update({
                content: `✅ **Configuração Completa**\n\nA pauta será resetada todo(a) **${dayName}** às **${selections.hour}:00**.\n\nEsta configuração é específica para este servidor.`,
                components: [],
              });
              configComplete = applySettings();
            } else {
              await selectInteraction.update({
                content: `⚙️ **Configuração de Reset**\n\nSelecione um dia da semana.\n\nHora selecionada: **${selections.hour}:00**`,
                components: [dayRow, hourRow]
              });
            }
          }
        }
      } catch (error) {
        // Timeout ou erro
        if (error.code === 'InteractionCollectorError') {
          await interaction.editReply({
            content: '⏱️ Tempo esgotado ou configuração incompleta. Nenhuma alteração foi realizada.',
            components: []
          });
        } else {
          logger.error(`Erro ao processar interação de configuração: ${error.message}`, error);
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao processar sua solicitação.',
            components: []
          });
        }
      }
    }
  })
};