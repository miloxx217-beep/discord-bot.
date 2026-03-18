module.exports = (client, shared) => {
    const fs = shared.fs;

    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        // komenda: !resetdowod @user
        if (!message.content.startsWith("!resetdowod")) return;

        const ownerId = "1478750576408793239"; // twoje ID
        if (message.author.id !== ownerId) {
            return message.reply("❌ Nie masz uprawnień do tej komendy.");
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply("❗ Użycie: `!resetdowod @użytkownik`");
        }

        // usuń użytkownika z listy
        shared.usersWithID.delete(user.id);

        // zapisz do pliku
        fs.writeFileSync("dowody_users.txt", [...shared.usersWithID].join("\n"));

        message.reply(`🔄 Zresetowano dowód użytkownika **${user.username}**.`);
    });
};
