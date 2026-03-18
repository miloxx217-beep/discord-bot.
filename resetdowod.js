const fs = require("fs");

module.exports = (client, shared) => {

    const { config, usersWithID } = shared;

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName !== "resetdowod") return;

        // tylko właściciel
        if (!interaction.member.roles.cache.has(config.WLASCICIEL_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Nie masz uprawnień do tej komendy.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("uzytkownik");

        // 1. Usuń z pamięci
        usersWithID.delete(user.id);

        // 2. Usuń z pliku
        if (fs.existsSync("dowody_users.txt")) {
            const lines = fs.readFileSync("dowody_users.txt", "utf8")
                .split("\n")
                .filter(line => line.trim() !== user.id);

            fs.writeFileSync("dowody_users.txt", lines.join("\n"));
        }

        // 3. Usuń rolę dowodu
        const member = interaction.guild.members.cache.get(user.id);
        if (member && member.roles.cache.has(config.DOWOD_ROLE_ID)) {
            await member.roles.remove(config.DOWOD_ROLE_ID).catch(() => {});
        }

        return interaction.reply({
            content: `✔ Zresetowano dowód użytkownika <@${user.id}>. Może wyrobić ponownie.`,
            ephemeral: false
        });
    });
};
