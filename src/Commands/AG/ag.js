// Importation du module principal de Discord pour interagir avec l'API
const Discord = require("discord.js");
// Importation des outils spécifiques pour créer des interfaces graphiques (Lignes, Boutons, Styles)
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
// Importation du module 'fs' (File System) pour lire et écrire dans les fichiers JSON (sauvegarde)
const fs = require("fs");

module.exports = {
  name: "ag",
  description: "Système de vote pour Assemblée Générale",
  // Permission de sécurité : Seuls les Administrateurs peuvent lancer/arrêter une AG
  permission: Discord.PermissionFlagsBits.Administrator,
  dm: false, // Désactive la commande en MP (doit se faire sur un serveur)

  // Configuration des sous-commandes (/ag demarrer et /ag arreter)
  options: [
    {
      type: "sub_command",
      name: "demarrer",
      description: "Lancer un nouveau vote",
      options: [
        {
          type: "string", // L'argument est du texte
          name: "sujet",
          description: "Le sujet du vote",
          required: true, // Obligatoire
        },
      ],
    },
    {
      type: "sub_command",
      name: "arreter",
      description: "Clôturer un vote et voir les résultats",
      options: [
        {
          type: "string", // L'argument est l'ID (une suite de chiffres)
          name: "id_message",
          description:
            "L'ID du message du vote (Clic droit sur le message -> Copier l'identifiant)",
          required: true,
        },
      ],
    },
  ],

  async run(bot, message, args) {
    // Récupère quelle sous-commande a été choisie ("demarrer" ou "arreter")
    const subCommand = args.getSubcommand();
    const votesFile = "./votes.json";

    // --- CHARGEMENT DE LA BASE DE DONNÉES ---
    // On lit le fichier votes.json pour récupérer les votes en cours.
    // Si le bot redémarre, il se souviendra des votes grâce à ce fichier.
    let votesDB = {};
    try {
      if (fs.existsSync(votesFile)) {
        votesDB = JSON.parse(fs.readFileSync(votesFile, "utf8"));
      }
    } catch (err) {}

    // ==============================================
    // 🟢 DÉMARRER UN VOTE
    // ==============================================
    if (subCommand === "demarrer") {
      // Récupère le texte tapé par l'admin dans l'option "sujet"
      let sujet = args.getString("sujet");

      // Création de la "carte" visuelle (Embed) qui affiche la question
      const embed = new Discord.EmbedBuilder()
        .setTitle("🗳️ Vote d'Assemblée Générale")
        .setDescription(
          `**Sujet :**\n${sujet}\n\n*Cliquez sur un bouton ci-dessous pour voter.*`,
        )
        .setColor("Blue")
        .setFooter({ text: "Vote en cours..." })
        .setTimestamp(); // Ajoute l'heure actuelle

      // Création de la ligne de boutons (ActionRow)
      // ButtonBuilder : Construit un bouton cliquable
      // setCustomId : L'identifiant invisible utilisé par le code pour savoir quel bouton est cliqué
      // setStyle : Définit la couleur (Success=Vert, Danger=Rouge, Secondary=Gris)
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vote_pour")
          .setLabel("Pour")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId("vote_contre")
          .setLabel("Contre")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("⛔"),
        new ButtonBuilder()
          .setCustomId("vote_neutre")
          .setLabel("Ne se prononce pas")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("😶"),
      );

      // Envoi du message dans le canal
      // fetchReply: true est CRUCIAL ici : il permet de récupérer l'objet du message envoyé (et donc son ID)
      const msg = await message.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      // SAUVEGARDE DES DONNÉES
      // On stocke les infos dans l'objet votesDB avec l'ID du message comme clé unique
      votesDB[msg.id] = {
        sujet: sujet,
        author: message.user.id,
        channel: message.channel.id,
        date: Date.now(),
        votes: {}, // Objet vide qui recevra plus tard { "ID_DU_MEMBRE": "pour" }
      };

      // Écriture physique dans le fichier JSON sur le disque dur
      fs.writeFileSync(votesFile, JSON.stringify(votesDB, null, 4));
    }

    // ==============================================
    // 🔴 ARRÊTER UN VOTE
    // ==============================================
    else if (subCommand === "arreter") {
      // L'admin fournit l'ID du message pour savoir quel vote arrêter
      let msgId = args.getString("id_message");

      // Vérification de sécurité : Est-ce que ce vote existe dans notre fichier JSON ?
      if (!votesDB[msgId])
        return message.reply("Ce vote n'existe pas ou est déjà clôturé.");

      // Récupération des données du vote
      let voteData = votesDB[msgId];
      let results = voteData.votes; // Contient tous les votes : { "ID1": "pour", "ID2": "contre" }

      // --- CALCUL DES RÉSULTATS (BOUCLE) ---
      // On prépare des listes pour stocker les noms des gens
      let listPour = [];
      let listContre = [];
      let listNeutre = [];

      // On boucle sur chaque vote enregistré
      // Object.entries transforme l'objet en liste : [[ID, CHOIX], [ID, CHOIX]]
      for (let [userId, choix] of Object.entries(results)) {
        // On essaie de trouver le membre sur le serveur pour avoir son Pseudo
        let member = message.guild.members.cache.get(userId);
        // Si on le trouve, on prend son Tag (Pseudo#0000), sinon on garde juste l'ID
        let name = member ? member.user.tag : userId;

        // On trie le nom dans la bonne liste
        if (choix === "pour") listPour.push(name);
        else if (choix === "contre") listContre.push(name);
        else listNeutre.push(name);
      }

      // --- CRÉATION DU RAPPORT LOGS ---
      // On crée un nouvel Embed pour afficher les résultats finaux
      let logEmbed = new Discord.EmbedBuilder()
        .setTitle("📊 Résultats du Vote (Nominatif)")
        .setDescription(`**Sujet :** ${voteData.sujet}`)
        .setColor("Gold")
        .addFields(
          // .join("\n") transforme la liste ["Pierre", "Paul"] en texte : "Pierre\nPaul" (saut de ligne)
          // Si la liste est vide (0 votes), on écrit "Personne"
          {
            name: `✅ POUR (${listPour.length})`,
            value: listPour.length ? listPour.join("\n") : "Personne",
            inline: true,
          },
          {
            name: `⛔ CONTRE (${listContre.length})`,
            value: listContre.length ? listContre.join("\n") : "Personne",
            inline: true,
          },
          {
            name: `😶 NEUTRE (${listNeutre.length})`,
            value: listNeutre.length ? listNeutre.join("\n") : "Personne",
            inline: true,
          },
        )
        .setTimestamp();

      // --- ENVOI DANS LE SALON LOGS ---
      try {
        // On lit la configuration des logs (logs.json) pour savoir où envoyer le rapport
        let logsConfig = JSON.parse(fs.readFileSync("./logs.json", "utf8"));
        let logChannelId = logsConfig[message.guild.id];

        if (logChannelId) {
          let logChannel = message.guild.channels.cache.get(logChannelId);
          // Si le salon existe, on envoie le rapport dedans
          if (logChannel) await logChannel.send({ embeds: [logEmbed] });
        } else {
          // Si pas de salon configuré, on envoie dans le salon actuel en avertissant
          await message.channel.send(
            "⚠️ Pas de salon logs configuré, voici le résultat ici :",
            { embeds: [logEmbed] },
          );
        }
      } catch (err) {
        // Sécurité : Si le fichier logs.json n'existe pas, on envoie ici
        await message.reply({
          content: "Voici les résultats :",
          embeds: [logEmbed],
        });
      }

      // --- MODIFICATION DU MESSAGE ORIGINAL ---
      // On veut désactiver les boutons pour que plus personne ne puisse voter
      try {
        // On retrouve le salon où le vote a eu lieu
        let voteChannel = message.guild.channels.cache.get(voteData.channel);
        if (voteChannel) {
          // On retrouve le message précis du vote
          let voteMsg = await voteChannel.messages.fetch(msgId);
          if (voteMsg) {
            // On recrée l'Embed en le mettant en Gris et en ajoutant "Clôturé"
            let closedEmbed = new Discord.EmbedBuilder(voteMsg.embeds[0].data)
              .setColor("Grey")
              .setFooter({ text: "❌ Ce vote est clôturé." });

            // .edit() modifie le message existant.
            // components: [] signifie "Mets la liste des boutons à vide" (supprime les boutons)
            await voteMsg.edit({ embeds: [closedEmbed], components: [] });
          }
        }
      } catch (e) {
        // Si le message a été supprimé entre temps, on ignore l'erreur
      }

      // --- NETTOYAGE ---
      // On supprime le vote de la base de données (JSON) car il est fini
      delete votesDB[msgId];
      // On sauvegarde le fichier nettoyé
      fs.writeFileSync(votesFile, JSON.stringify(votesDB, null, 4));

      // Confirmation finale à l'admin
      await message.reply(
        "✅ Le vote a été clôturé et les résultats envoyés dans les logs.",
      );
    }
  },
};
