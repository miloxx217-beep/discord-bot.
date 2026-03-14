const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = (client, shared) => {
    const { config, generateDowodNumber, usersWithID, saveUserID } = shared;

    // PRZYCISK – start dowodu (blokada po roli)
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "dowod_start") return;

        // BLOKADA po roli
        if (interaction.member.roles.cache.has(config.DOWOD_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Posiadasz już dowód osobisty — nie możesz złożyć wniosku ponownie.",
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId("dowod_modal")
            .setTitle("Wniosek o dowód osobisty");

        const imie = new TextInputBuilder()
            .setCustomId("dowod_imie")
            .setLabel("Imię")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nazwisko = new TextInputBuilder()
            .setCustomId("dowod_nazwisko")
            .setLabel("Nazwisko")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const plec = new TextInputBuilder()
            .setCustomId("dowod_plec")
            .setLabel("Płeć")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const obywatelstwo = new TextInputBuilder()
            .setCustomId("dowod_obywatelstwo")
            .setLabel("Obywatelstwo")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(imie),
            new ActionRowBuilder().addComponents(nazwisko),
            new ActionRowBuilder().addComponents(plec),
            new ActionRowBuilder().addComponents(obywatelstwo)
        );

        return interaction.showModal(modal);
    });

    // MODAL – dowód
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== "dowod_modal") return;

        // blokada po pliku
        if (usersWithID.has(interaction.user.id)) {
            return interaction.reply({
                content: "❌ Masz już wyrobiony dowód osobisty.",
                ephemeral: true
            });
        }

        const imie = interaction.fields.getTextInputValue("dowod_imie");
        const nazwisko = interaction.fields.getTextInputValue("dowod_nazwisko");
        const plec = interaction.fields.getTextInputValue("dowod_plec");
        const obywatelstwo = interaction.fields.getTextInputValue("dowod_obywatelstwo");

        const dowodyChannel = interaction.guild.channels.cache.get(config.DOWODY_CHANNEL_ID);

        const numerDowodu = generateDowodNumber();
        saveUserID(interaction.user.id);

        if (dowodyChannel) {
            const embedData = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:koperta:1479760548500471830> Nowy dowód osobisty  
Użytkownik: ${interaction.user}

Imię: ${imie}
Nazwisko: ${nazwisko}
Płeć: ${plec}
Obywatelstwo: ${obywatelstwo}

Numer dowodu: **${numerDowodu}**`);

            await dowodyChannel.send({ embeds: [embedData] });
        }

        // nadaj rolę dowodu
        const rolaDowod = interaction.guild.roles.cache.get(config.DOWOD_ROLE_ID);
        if (rolaDowod) {
            await interaction.member.roles.add(rolaDowod);
        }

        return interaction.reply({
            content: "Twój wniosek o dowód został wysłany!",
            ephemeral: true
        });
    });
};
