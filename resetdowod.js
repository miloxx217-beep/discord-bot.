module.exports = (client, shared) => {
    const fs = shared.fs;

    client.on("interactionCreate", async interaction => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName !== "resetdowod") return;

        const ownerId = "TWÓJ_ID"; // ← WSTAW SWOJE ID

        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: "❌ Nie masz uprawnień do tej komendy.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("uzytkownik");

        // usuń użytkownika z listy
        shared.usersWithID.delete(user.id);

        // zapisz do pliku
        fs.writeFileSync("dowody_users.txt", [...shared.usersWithID].join("\n"));

        return interaction.reply(`🔄 Zresetowano dowód użytkownika **${user.username}**.`);
    });
};
