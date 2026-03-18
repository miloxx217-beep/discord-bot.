const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resetdowod")
        .setDescription("Resetuje możliwość wyrabiania dowodu użytkownikowi (tylko właściciel).")
        .addUserOption(option =>
            option.setName("uzytkownik")
                .setDescription("Użytkownik, któremu chcesz zresetować dowód")
                .setRequired(true)
        ),

    async execute(interaction, client, shared) {
        const ownerId = "TWÓJ_ID"; // ← TU WSTAW SWOJE ID DISCORDA

        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: "❌ Nie masz uprawnień do tej komendy.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("uzytkownik");

        // usuń użytkownika z listy osób z dowodem
        shared.usersWithID.delete(user.id);

        // zapisz do pliku
        const fs = shared.fs;
        fs.writeFileSync("dowody_users.txt",
            [...shared.usersWithID].join("\n")
        );

        return interaction.reply(`🔄 Zresetowano dowód użytkownika **${user.username}**.`);
    }
};
