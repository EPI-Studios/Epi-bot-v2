const Discord = require("discord.js")
const fs = require("fs") // Nécessaire pour lire et modifier la liste de présence

module.exports = {

    name: "present",
    description: "Confirmer sa présence lors de l'AG",
    // On met "Aucune" car techniquement tout le monde peut taper la commande.
    // C'est le code à l'intérieur qui va bloquer ceux qui n'ont pas le rôle.
    permission: "Aucune", 
    dm: false,
    options: [],

    async run(bot, message, args) {

        // ====================================================
        // 1. VÉRIFICATION DE SÉCURITÉ (LE RÔLE)
        // ====================================================
        
        // On récupère la liste des rôles du membre qui tape la commande.
        // .some() est une fonction qui dit "Est-ce qu'au moins UN des rôles s'appelle 'membres epi studio' ?"
        // Cela renvoie 'true' (Vrai) ou 'false' (Faux).
        let hasRole = message.member.roles.cache.some(role => role.name === "membres epi studio");

        // Si hasRole est Faux, on arrête tout immédiatement.
        if (!hasRole) {
            // ephemeral: true signifie que seul l'utilisateur voit ce message d'erreur (ça ne pollue pas le chat)
            return message.reply({ content: "❌ Vous n'avez pas le rôle `membres epi studio`. Vous ne pouvez pas signer la feuille de présence.", ephemeral: true });
        }

        // ====================================================
        // 2. LECTURE DE LA LISTE DE PRÉSENCE
        // ====================================================
        
        const file = "./presence.json";
        let data = {};
        
        try {
            // On essaie de lire le fichier.
            // Si l'admin n'a jamais fait "/appel debut", le fichier n'existe pas et ça déclenche une erreur (catch).
            data = JSON.parse(fs.readFileSync(file, "utf8"));
        } catch (err) {
            return message.reply({ content: "❌ Aucun appel n'est en cours actuellement (Demandez à un admin d'ouvrir l'appel).", ephemeral: true });
        }

        // Si le fichier existe, mais que l'admin a fait "/appel fin" (isOpen = false)
        if (!data.isOpen) {
            return message.reply({ content: "❌ L'appel n'est pas ouvert ou est déjà terminé.", ephemeral: true });
        }

        // ====================================================
        // 3. VÉRIFICATION ANTI-DOUBLON
        // ====================================================
        
        // On vérifie si l'ID du membre est DÉJÀ dans la liste "attendees".
        // Cela empêche quelqu'un de signer 50 fois pour fausser les comptes.
        if (data.attendees.includes(message.user.id)) {
            return message.reply({ content: "✅ Vous êtes déjà noté comme présent !", ephemeral: true });
        }

        // ====================================================
        // 4. ENREGISTREMENT ET SAUVEGARDE
        // ====================================================
        
        // .push() ajoute l'ID à la fin de la liste
        data.attendees.push(message.user.id);
        
        // On sauvegarde immédiatement la nouvelle liste dans le fichier JSON
        fs.writeFileSync(file, JSON.stringify(data, null, 4));

        // Confirmation finale (toujours en ephemeral pour ne pas spammer le channel si 50 personnes signent en même temps)
        await message.reply({ content: `✅ **${message.user.username}**, votre présence a bien été notée.`, ephemeral: true });
    }
}