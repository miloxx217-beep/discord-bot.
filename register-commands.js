const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = async () => {

    const commands = [

        new SlashCommandBuilder()
            .setName("pracuj")
            .setDescription("Pracuj i zarób od 30 do 400 monet."),

        new SlashCommandBuilder()
            .setName("dodajkase")
            .setDescription("Dodaj pieniądze użytkownikowi (tylko właściciel).")
            .addUserOption(option =>
                option.setName("uzytkownik")
                    .setDescription("Użytkownik, któremu chcesz dodać kasę")
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName("kwota")
                    .setDescription("Kwota do dodania")
                    .setRequired(true)),

        new SlashCommandBuilder()
            .setName("resetdowod")
            .setDescription("Resetuje możliwość wyrabiania dowodu użytkownikowi (tylko właściciel).")
            .addUserOption(option =>
                option.setName("uzytkownik")
                    .setDescription("Użytkownik, któremu chcesz zresetować dowód")
                    .setRequired(true))
    ]
        .map(cmd => cmd.toJSON());

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        console.log("Rejestrowanie komend...");
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, "1478750576408793239"),
            { body: commands }
        );
        console.log("Komendy zarejestrowane!");
    } catch (err) {
        console.error(err);
    }
};
