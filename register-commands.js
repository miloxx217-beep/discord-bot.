const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

const commands = [

    new SlashCommandBuilder()
        .setName("pracuj")
        .setDescription("Pracujesz i zarabiasz pieniądze.")
        .toJSON(),

    new SlashCommandBuilder()
        .setName("dodajkase")
        .setDescription("Dodaje kasę użytkownikowi (tylko właściciel).")
        .addUserOption(option =>
            option.setName("uzytkownik")
                .setDescription("Komu dodać kasę")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("kwota")
                .setDescription("Ile dodać")
                .setRequired(true)
        )
        .toJSON()
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log("Rejestrowanie komend...");
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log("Komendy zarejestrowane!");
    } catch (err) {
        console.error(err);
    }
})();
