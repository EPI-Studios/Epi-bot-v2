const { SlashCommanBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, calculateShardId } = require('discord.js');
const User = require('../../Schemas.js/userAccount');



module.exports = {
    data: new SlashCommanBuilder()
        .setName('blackjack')
        .setDescription('Start le jeu du black jack')
        .addStringOption(option => option.setName('bet').setDescription('montant à parier').setRequired(true)),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'blackjack') {
            try {

                const user = await User.findOne({ userId: interaction.user.id });
                if (!user) {
                    await interaction.reply({ content: "Vous n'avez pas de compte. Utilisez /start pour en créer un", ephemeral: true })
                    return;
                }

                const betAmount = interaction.options.getInteger('bet');
                if (user.balance < betAmount) {
                    await interaction.reply({ content: "Vous ne disposez pas de suffisamment de devises pour placer un pari.", ephemeral: true })
                    return;
                }
                let deck = createDeck();
                let playerHand = [drawCard(deck), drawCard(deck)];
                let dealerHand = [drawCard(deck), drawCard(deck)];

                let playerTotal = calculateHand(playerHand);
                let dealerTotal = calculateHand(dealerHand);

                let embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('BlackJack')
                    .setDescription('Hit - prendre une autre carte\nStand - mettre fin au jeu\nDouble Down - doubler le mise, prendre une carte, puis mettre fin au jeu')
                    .addFields(
                        { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                        { name: 'Main du dealer', value: `${formatHand([dealerHand[0]])}, ?\nValue: ?`, inline: true },
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('hit')
                            .setLabel('Hit')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('stand')
                            .setLabel('Stand')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('doubleDown')
                            .setLabel('Double Down')
                            .setStyle(ButtonStyle.Success)
                    );

                await interaction.reply({ embeds: [embed], component: [row] });

                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

                collector.on('collect', async i => {
                    if (!i.isButton()) return;
                    await i.deferUpdate();

                    if (i.customId === 'hit') {
                        playerHand.push(drawCard(deck));
                        playerTotal = calculateHand(playerHand);

                        if (playerTotal > 21) {
                            user.balance -= betAmount;
                            await user.save();

                            embed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('BlackJack')
                                .addFields(
                                    { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                );

                            const disableRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );

                            await i.editReply({ embed: [embed], components: [disableRow] });
                            collector.stop();
                        } else {
                            embed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('BlackJack')
                                .setDescription('Hit - prendre une autre carte\nStand - mettre fin au jeu\nDouble Down - doubler le mise, prendre une carte, puis mettre fin au jeu')
                                .addFields(
                                    { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Main du dealer', value: `${formatHand([dealerHand[0]])}, ?\nValue: ?`, inline: true },
                                );
                            await i.editReply({ embeds: [embed] });
                        }
                    } else if (i.customId === 'stand') {
                        while (dealerTotal < 17) {
                            dealerHand.push(drawCard(deck));
                            dealerTotal = calculateHand(dealerHand);
                        }

                        if (dealerTotal > 21 || dealerTotal < playerTotal) {
                            user.balance += betAmount;
                            embed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('BlackJack')
                                .addFields(
                                    { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Main du dealer', value: `You won +${betAmount} ?`, inline: false }
                                );

                        } else if (dealerTotal === playerTotal) {
                            embed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('BlackJack')
                                .addFields(
                                    { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                    { name: '\u200B', value: `Push, bet returned`, inline: false }
                                );
                        }   else {
                            user.balance -= betAmount;
                            embed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('BlackJack')
                                .addFields(
                                    { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                    { name: '\u200B', value: `You lost -${betAmount} ?`, inline: false }
                                );
                        }
                        await user.save();

                         const disableRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );

                            await i.editReply({ embeds: [embed], components: [disableRow] });
                            collector.stop();

                    } else if (i.customId === 'doubleDown') {
                        playerHand.push(drawCard(deck));
                        playerTotal = calculateHand(playerHand);

                        if (playerTotal > 21) {
                            user.balance -= betAmount * 2;
                            await user.save();

                            embed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('BlackJack')
                                .addFields(
                                    { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                    { name: '\u200B', value: `You lost ${betAmount * 2} ?`, inline: false }
                                );

                            const disableRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );

                            await i.editReply({ embeds: [embed], components: [disableRow] });
                            collector.stop();

                        } else {
                            while (dealerTotal < 17) {
                                dealerHand.push(drawCard(deck));
                                dealerTotal = calculateHand(dealerHand);
                            }

                            if (dealerTotal > 21 || dealerTotal < playerTotal) {
                                user.balance += betAmount * 2;
                                embed = new EmbedBuilder()
                                    .setColor('Random')
                                    .setTitle('Blackjack')
                                    .addFields(
                                        { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                        { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                        { name: '\u200B', value: `You won +${betAmount * 2} ?`, inline: false }
                                    );
                            } else if (dealerTotal === playerTotal) {
                                embed = new EmbedBuilder()
                                    .setColor('Random')
                                    .setTitle('BlackJack')
                                    .addFields(
                                        { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                        { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                        { name: '\u200B', value: `Push, bet Returned`, inline: false }
                                    )
                                    .setTimestamp()
                            } else {
                                user.balance -= betAmount * 2;
                                embed = new EmbedBuilder()
                                    .setColor('Random')
                                    .setTitle('BlackJack')
                                    .addFields(
                                        { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                        { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                        { name: '\u200B', value: `You lost -${betAmount * 2} ?`, inline: false }
                                    );
                            }
                            await user.save();

                                const disableRow = new ActionRowBuilder()
                                    .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );

                            await i.editReply({ embeds: [embed], components: [disableRow] })
                            collector.stop();
                        }
                    }
                });

                collector.end('end', async collected => {
                    if (collected.size === 0) {
                        const dealerTotal = calculateHand(dealerHand);
                        embed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('BlackJack')
                            .setDescription("La partie a été annulée en raison de l'inactivité.")
                             .addFields(
                                { name: 'Votre main', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Main du dealer', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                            );

                            const disableRow = new ActionRowBuilder()
                                    .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );

                            await interaction.reply({embeds: [embed], components: [disableRow] })
                    }
                })

            } catch (error) {
                console.error('Error:', error)
                await interaction.reply({ content: "une erreur s'est produite"})
            }
        }
    }
};

// fonction

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
}


function drawCard(deck) {
    const randomIndex = Math.floor(Math.random() * deck.lenght );
    const card = deck.splice(randomIndex, 1)[0];
    return card;
}

function calculateHand(hand) {
    let total = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aces++;
            total += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            total += 10;
        } else {
            total += parseInt(card.value);
        }
    }

    while (total > 21 & aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function formatHand(hand) {
    return hand.map(card => `${card.value}${card.suit}`).join(', ');
}