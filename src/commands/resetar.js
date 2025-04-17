const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { resetAgenda, resetSuggestions } = require('../utils/agenda');
const logger = require('../utils/logger');
const { handleAsync } = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetar')
    .setDescription('Resetar a pauta ou sugestões (requer permissão)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('pauta')
        .setDescription('Resetar a pauta atual (move para histórico)'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('sugestoes')
        .setDescription('Resetar todas as sugestões pendentes')),
  
  execute: handleAsync(async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Verificar se o usuário tem o papel de líder ou é administrador
    const isLeader = interaction.member.roles.cache.has(process.env.LEADER_ROLE_ID) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isLeader) {
      logger.info(`Guild ${guildId}: Usuário sem permissão tentou resetar: ${interaction.user.tag} (${interaction.user.id})`);
      return interaction.reply({
        content: '❌ Você não tem permissão para resetar a pauta ou sugestões. Apenas líderes e administradores podem usar este comando.',
        ephemeral: true
      });
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    // Criar botões de confirmação
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_reset')
      .setLabel('Confirmar Reset')
      .setStyle(ButtonStyle.Danger);
    
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_reset')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
    let confirmMessage = '';
    let successMessage = '';
    let cancelMessage = '';
    let successNotificationMessage = '';
    
    if (subcommand === 'pauta') {
      confirmMessage = '⚠️ **Atenção**\n\nVocê está prestes a resetar a pauta atual. Todos os itens serão movidos para o histórico.\n\nDeseja continuar?';
      successMessage = '✅ A pauta foi resetada com sucesso. Todos os itens foram movidos para o histórico.';
      cancelMessage = 'Operação cancelada. A pauta não foi alterada.';
      successNotificationMessage = `📢 **Aviso**: ${interaction.user.toString()} resetou a pauta. Uma nova pauta está disponível!`;
    } else if (subcommand === 'sugestoes') {
      confirmMessage = '⚠️ **Atenção**\n\nVocê está prestes a resetar todas as sugestões pendentes. Esta ação não pode ser desfeita.\n\nDeseja continuar?';
      successMessage = '✅ Todas as sugestões pendentes foram removidas com sucesso.';
      cancelMessage = 'Operação cancelada. As sugestões não foram alteradas.';
      successNotificationMessage = `📢 **Aviso**: ${interaction.user.toString()} resetou todas as sugestões pendentes.`;
    }
    
    // Enviar mensagem de confirmação
    const response = await interaction.reply({
      content: confirmMessage,
      components: [row],
      ephemeral: true,
      fetchReply: true
    });
    
    // Coletor para os botões
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000 // 30 segundos para responder
    });
    
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ Estes botões não são para você.',
          ephemeral: true
        });
      }
      
      await i.update({
        components: []
      });
      
      if (i.customId === 'cancel_reset') {
        await i.editReply({
          content: cancelMessage,
          ephemeral: true
        });
        return;
      }
      
      if (i.customId === 'confirm_reset') {
        let success = false;
        
        if (subcommand === 'pauta') {
          success = resetAgenda(guildId);
          logger.info(`Guild ${guildId}: Pauta resetada por ${interaction.user.tag} (${interaction.user.id})`);
        } else if (subcommand === 'sugestoes') {
          success = resetSuggestions(guildId);
          logger.info(`Guild ${guildId}: Sugestões resetadas por ${interaction.user.tag} (${interaction.user.id})`);
        }
        
        if (success) {
          await i.editReply({
            content: successMessage,
            ephemeral: true
          });
          
          // Notificar no canal
          await interaction.channel.send({
            content: successNotificationMessage
          });
        } else {
          await i.editReply({
            content: '❌ Ocorreu um erro ao executar o reset.',
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
  })
};