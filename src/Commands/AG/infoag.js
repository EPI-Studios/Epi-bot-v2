const Discord = require("discord.js");
// On importe 'fs' (File System) pour pouvoir lire et écrire dans le fichier presence.json
const fs = require("fs");

module.exports = {
  name: "infoag",
  description: "Créer (admin) ou voir l'ordre du jour",
  dm: false, // Commande utilisable uniquement sur un serveur (pas en MP)

  // On utilise des SOUS-COMMANDES pour regrouper "debut" et "fin" dans une seule commande /appel
  options: [
    {
      type: "sub_command",
      name: "créer",
      description: "Modifier l'ordre du jour",
    },
    {
      type: "sub_command",
      name: "mp",
      description: "Envoyer en MP l'ordre du jour actuel",
    },
  ],
  /**
   *
   * @param {Discord.Client} bot
   * @param {Discord.ChatInputCommandInteraction} message
   * @param {typeof Discord.ChatInputCommandInteraction.prototype.options} args
   */
  async run(bot, message, args) {
    const sc = args.getSubcommand();
    const InfoAgPath = `${process.cwd()}/info_ag.json`;
    const infoAgContent = JSON.parse(fs.readFileSync(InfoAgPath, "utf-8"));

    switch (sc) {
      case "mp":
        if (!("title" in infoAgContent)) {
          await message.reply({
            content:
              "Le contenu de l'ordre du jour n'a pas encore été mis à jour...",
            flags: ["Ephemeral"],
          });
        } else {
          let owner = await message.guild.fetchOwner();
          let embed = new Discord.EmbedBuilder()
            .setTitle(infoAgContent.title)
            .setDescription(infoAgContent.description)
            .setFooter({
              text: owner.user.username,
              iconURL: owner.displayAvatarURL(),
            })
            .setAuthor({
              name: message.user.username,
              iconURL: message.user.displayAvatarURL(),
            });

          if (infoAgContent.image) embed.setImage(infoAgContent.image);

          let toBeDeleted = await message.reply({
            content: "_ _",
            flags: ["Ephemeral"],
          });

          await message.deleteReply(toBeDeleted);
          await message.user.send({ embeds: [embed] });
        }
        break;
      case "créer":
        let title = "";
        let description = "";
        let imageUrl = "";

        if (
          !message.guild.members.cache
            .get(message.user.id)
            .permissions.has("AddReactions")
        ) {
          await message.reply({
            content:
              "Vous n'êtes pas administrateur pour effectuer cette action!",
            flags: ["Ephemeral"],
          });
          return;
        }
        function listenNextMessage(userId) {
          return new Promise((resolve, reject) => {
            if (
              !message.channel ||
              !(message.channel instanceof Discord.TextChannel)
            )
              return;

            let collector = message.channel.createMessageCollector({
              filter: (m) => m.author.id === userId,
            });
            collector.on("collect", async (message) => {
              resolve(message);
              await message.delete();
              collector.stop();
            });
          });
        }

        // Demander le titre

        await message.reply({
          flags: ["Ephemeral"],
          content:
            "Veuillez entrer le titre de l'ordre du jour. (`cancel`) pour annuler.",
        });

        const titleMsg = await listenNextMessage(message.user.id);

        if (titleMsg.content === "cancel") return;

        title = titleMsg.content;

        // Demander une description

        await message.reply({
          flags: ["Ephemeral"],
          content:
            "Veuillez entrer la description de l'ordre du jour. (`cancel`) pour annuler.",
        });

        const descMsg = await listenNextMessage(message.user.id);

        if (descMsg.content === "cancel") return;

        description = descMsg.content;

        // Demander une image (optionnel)

        await message.reply({
          flags: ["Ephemeral"],
          content:
            "Veuillez entrer une image pour l'ordre du jour. (`cancel`) pour annuler.",
        });

        const imageUrlMsg = await listenNextMessage(message.user.id);

        if (imageUrlMsg.content === "cancel") return;

        imageUrl = imageUrlMsg.content;

        infoAgContent = {
          title,
          description,
          image: imageUrl,
        };

        fs.writeFileSync(InfoAgPath, JSON.stringify(infoAgContent));

        break;
    }
  },
};
