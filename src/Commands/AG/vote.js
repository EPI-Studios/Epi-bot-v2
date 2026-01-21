const Discord = require("discord.js")
const fs = require("fs") // Nécessaire pour les logs
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Component } = require("react");
const { time } = require("console");

module.exports = {
    name: "vote",
    description: "Système de vote",
    permission: "a définir",
    dm: true,
    options: [
        {
            type: "admin",
            name: "",
            description: "Sujet",
            required: true
        }
    ],

const createSujet = new ButtonBuilder()
    .setCustomId('create_topic')
    .setLabel('Créer un sujet')
    .setStyle(ButtonStyle.Premium)
    .setEmoji('📊')

const row = new ActionRowBuilder().addComponents(createTopic);

await Interaction.reply({
    content: 'Clique pour créer un sujet',
    Components: [row]
});

const filter = i => i.user.id === interaction.user.id;
const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 60000
});

// il manque comment appeler l'écoute
collector.on('collect', async i => {
    if (i.setCustomId = 'create_topic') {


        // embed
        let embed = new EmbedBuilder()
            .setTitle('Sujet')
            .setColor('Random')
            .setDescription('Votez pour le sujet suivant')

        // Boutons de votes 
        const voteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId()
                .setLabel('Pour')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🤙'),

            new ButtonBuilder()
                .setCustomId()
                .setLabel('Contre')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('😡'),

            new ButtonBuilder()
                .setCustomId()
                .setLabel('Ne se prononce pas')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🙊')
        }  

)};

//commande pour arreter le vote

//le bot envoi dans le salon log les résultats

//dans le salon nominer les votes avec qui a voter quoi 