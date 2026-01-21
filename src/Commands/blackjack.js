const Discord = require('discord.js');
// Importation des constructeurs pour l'interface graphique (Boutons, Lignes)
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: 'blackjack',
    description: 'Jouez au blackjack (Avec options Split et Double)',
    permission: "Aucune",
    dm: true,
    options: [],

    async run(bot, message, args) {

        // ====================================================
        // 1. FONCTIONS UTILITAIRES (MOTEUR DU JEU)
        // ====================================================

        // Crée un paquet de 52 cartes
        function createDeck() {
            const suits = ['♠', '♥', '♦', '♣'];
            const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            let deck = [];
            for (let suit of suits) {
                for (let value of values) {
                    deck.push({ suit, value }); // Ajoute chaque carte comme un objet
                }
            }
            return deck;
        }

        // Tire une carte et la retire du paquet (pour éviter les doublons)
        function drawCard(deck) {
            const randomIndex = Math.floor(Math.random() * deck.length);
            return deck.splice(randomIndex, 1)[0];
        }

        // Calcule le score d'une main (Gère les As: 1 ou 11)
        function calculateHandValue(hand) {
            let value = 0;
            let aceCount = 0;

            for (let card of hand) {
                if (card.value === 'A') {
                    aceCount++;
                    value += 11; // Par défaut l'As vaut 11
                } else if (['K', 'Q', 'J'].includes(card.value)) {
                    value += 10; // Les têtes valent 10
                } else {
                    value += parseInt(card.value); // Les chiffres valent leur nombre
                }
            }
            // Si on dépasse 21 et qu'on a un As, on le transforme en 1 (-10 points)
            while (value > 21 && aceCount > 0) {
                value -= 10;
                aceCount--;
            }
            return value;
        }

        // Prépare le texte à afficher pour une main (ex: "♠A ♥K (Total: 21)")
        // isActive = true ajoute une petite flèche pour dire "C'est à cette main de jouer"
        function formatHand(hand, isActive) {
            const cardsString = hand.map(card => `\`${card.suit}${card.value}\``).join(' ');
            const score = calculateHandValue(hand);
            const arrow = isActive ? " **En cours**" : "";
            return `${cardsString} (Total: ${score}) ${arrow}`;
        }

        // ====================================================
        // 2. INITIALISATION DES DONNÉES
        // ====================================================

        let deck = createDeck();
        
        // --- CŒUR DU SYSTÈME MULTI-MAIN (SPLIT) ---
        // Au lieu d'une simple variable, on utilise un Tableau d'objets.
        // Index 0 = Main principale. Si on split, on ajoute l'index 1.
        let playerHands = [
            { 
                cards: [drawCard(deck), drawCard(deck)], // Les cartes
                done: false,    // Est-ce que cette main a fini de jouer ?
                doubled: false  // Est-ce qu'on a fait "Double" dessus ?
            }
        ];
        
        let currentHandIndex = 0; // Sert à savoir quelle main joue actuellement (0 ou 1)

        let dealerHand = [drawCard(deck), drawCard(deck)];
        
        // ====================================================
        // 3. GENERATEURS D'INTERFACE (EMBED & BOUTONS)
        // ====================================================

        // Fonction qui redessine l'Embed à chaque tour
        const generateEmbed = (gameOver = false) => {
            // Si la partie est finie (gameOver), on montre tout le jeu du dealer.
            // Sinon, on cache la 2ème carte avec un point d'interrogation.
            let dealerString = gameOver 
                ? formatHand(dealerHand, false) 
                : `\`${dealerHand[0].suit}${dealerHand[0].value}\` \`❓ ?\``;

            const embed = new Discord.EmbedBuilder()
                .setTitle('🎰 Blackjack')
                .setColor('Blue')
                .setFooter({ text: `Au tour de ${message.user.username}` });

            // On boucle sur toutes les mains du joueur (utile s'il a split)
            playerHands.forEach((hand, index) => {
                embed.addFields({ 
                    // Si Split, on affiche "Main Joueur 1", "Main Joueur 2"
                    name: `Main Joueur ${playerHands.length > 1 ? index + 1 : ''}`, 
                    value: formatHand(hand.cards, index === currentHandIndex && !gameOver), 
                    inline: false 
                });
            });

            embed.addFields({ name: 'Main Croupier', value: dealerString, inline: false });
            return embed;
        };

        // Fonction qui décide quels boutons afficher
        const generateButtons = () => {
            const currentHand = playerHands[currentHandIndex]; // La main qu'on joue actuellement
            const row = new ActionRowBuilder();

            // Boutons de base (toujours là)
            row.addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Tirer').setStyle(ButtonStyle.Primary).setEmoji('🃏'),
                new ButtonBuilder().setCustomId('stand').setLabel('Rester').setStyle(ButtonStyle.Secondary).setEmoji('✋')
            );

            // Bouton DOUBLE : Seulement si on a 2 cartes au début du tour
            if (currentHand.cards.length === 2) {
                row.addComponents(
                    new ButtonBuilder().setCustomId('double').setLabel('Doubler').setStyle(ButtonStyle.Success).setEmoji('✖️')
                );
            }

            // Bouton SPLIT : Conditions strictes
            // 1. Avoir 2 cartes
            // 2. Avoir une seule main (on ne peut pas split deux fois de suite ici)
            // 3. Les cartes doivent avoir la même valeur (ex: deux 8, ou un Roi et un 10)
            if (currentHand.cards.length === 2 && playerHands.length === 1 && 
               (currentHand.cards[0].value === currentHand.cards[1].value || 
               (['K','Q','J','10'].includes(currentHand.cards[0].value) && ['K','Q','J','10'].includes(currentHand.cards[1].value)))) {
                
                row.addComponents(
                    new ButtonBuilder().setCustomId('split').setLabel('Split').setStyle(ButtonStyle.Secondary).setEmoji('✂️')
                );
            }

            return row;
        };

        // Envoi du tout premier message
        const gameMessage = await message.reply({ 
            embeds: [generateEmbed()], 
            components: [generateButtons()], 
            fetchReply: true 
        });

        // ====================================================
        // 4. BOUCLE DE JEU (COLLECTOR)
        // ====================================================

        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 60 secondes max pour jouer
        });

        collector.on('collect', async interaction => {
            // Sécurité : on empêche les autres de cliquer
            if (interaction.user.id !== message.user.id) {
                return interaction.reply({ content: "Pas touche ! Crée ta propre partie.", ephemeral: true });
            }

            const action = interaction.customId;
            let hand = playerHands[currentHandIndex]; // Raccourci vers la main active

            // --- CAS 1 : SPLIT (SEPARER) ---
            if (action === 'split') {
                // On retire la 2ème carte de la main 1
                const splitCard = hand.cards.pop();
                
                // On crée une NOUVELLE main (index 1) avec cette carte
                playerHands.push({ cards: [splitCard], done: false, doubled: false });
                
                // On redistribue une carte à chacune des deux mains pour qu'elles en aient 2
                hand.cards.push(drawCard(deck));
                playerHands[1].cards.push(drawCard(deck));

                // On met à jour l'affichage
                await interaction.update({ embeds: [generateEmbed()], components: [generateButtons()] });
                return;
            }

            // --- CAS 2 : DOUBLE (DOUBLER) ---
            if (action === 'double') {
                hand.cards.push(drawCard(deck)); // On tire UNE carte
                hand.doubled = true;
                hand.done = true; // IMPORTANT : Au double, le tour s'arrête forcément après la carte
                
                await checkTurn(interaction); // On vérifie si on doit passer à la main suivante
                return;
            }

            // --- CAS 3 : HIT (TIRER) ---
            if (action === 'hit') {
                hand.cards.push(drawCard(deck));
                const value = calculateHandValue(hand.cards);

                if (value >= 21) {
                    // Si on a 21 ou qu'on a sauté (Bust), cette main est finie
                    hand.done = true; 
                    await checkTurn(interaction);
                } else {
                    // Sinon, on continue de jouer cette main
                    await interaction.update({ embeds: [generateEmbed()], components: [generateButtons()] });
                }
                return;
            }

            // --- CAS 4 : STAND (RESTER) ---
            if (action === 'stand') {
                hand.done = true; // On valide cette main
                await checkTurn(interaction); // On regarde la suite
                return;
            }
        });

        // Fonction "Chef de Gare" : Elle décide où va le jeu
        async function checkTurn(interaction) {
            // Si la main actuelle est marquée "done" (finie)
            if (playerHands[currentHandIndex].done) {
                
                // Est-ce qu'il y a encore une main après ? (Cas du split)
                if (currentHandIndex < playerHands.length - 1) {
                    currentHandIndex++; // OUI -> On passe à l'index suivant (Main 2)
                    await interaction.update({ embeds: [generateEmbed()], components: [generateButtons()] });
                } else {
                    // NON -> Toutes les mains du joueur sont finies. On arrête le collector.
                    collector.stop('finished');
                    // Petite astuce pour éviter les erreurs d'interaction discord
                    if (!interaction.replied && !interaction.deferred) await interaction.deferUpdate();
                }
            } else {
                // Si la main n'est pas finie, on met juste à jour l'image
                await interaction.update({ embeds: [generateEmbed()], components: [generateButtons()] });
            }
        }

        // ====================================================
        // 5. FIN DE PARTIE (TOUR DU DEALER + RESULTATS)
        // ====================================================

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') return message.editReply({ content: '⏱️ Temps écoulé !', components: [] });

            // --- IA DU DEALER ---
            let dealerValue = calculateHandValue(dealerHand);
            // Tant qu'il a moins de 17, il tire
            while (dealerValue < 17) {
                dealerHand.push(drawCard(deck));
                dealerValue = calculateHandValue(dealerHand);
            }

            // --- CALCUL FINAL ---
            const embed = generateEmbed(true); // true = On affiche tout (plus de mystère)
            let resultText = "";

            // On compare CHAQUE main du joueur au dealer
            playerHands.forEach((hand, index) => {
                const playerValue = calculateHandValue(hand.cards);
                let status = "";
                // Si on a plusieurs mains, on ajoute un préfixe (ex: "Main 1 :")
                let prefix = playerHands.length > 1 ? `**Main ${index + 1} :** ` : "";

                if (playerValue > 21) {
                    status = " Bust (Perdu)";
                } else if (dealerValue > 21) {
                    status = " Gagné (Dealer a sauté)";
                } else if (playerValue > dealerValue) {
                    status = " Gagné";
                } else if (playerValue < dealerValue) {
                    status = " Perdu";
                } else {
                    status = " Égalité";
                }

                if (hand.doubled) status += " (Doublé !)";
                resultText += `${prefix}${status}\n`;
            });

            // On ajoute le texte final dans l'embed
            embed.setDescription(`**Résultats :**\n${resultText}`);
            
            // On envoie la mise à jour finale et on retire les boutons
            await message.editReply({ embeds: [embed], components: [] });
        });
    }
};