module.exports = (client) => {

    const {
        EmbedBuilder,
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
        ModalBuilder,
        TextInputBuilder,
        TextInputStyle
    } = require("discord.js");

    const POLICJA_ROLE_ID = "1479874725302763702";
    const WYSTAW_MANDAT_CHANNEL_ID = "1480913935627718708";
    const MANDATY_CHANNEL_ID = "1480914501418094794";

    // PANEL WYSTAWIANIA MANDATÓW
    client.once("ready", async () => {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const panel = guild.channels.cache.get(WYSTAW_MANDAT_CHANNEL_ID);
        if (!panel) return;

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle("🚓 Wystaw mandat")
            .setDescription(
`Panel służy funkcjonariuszom policji do wystawiania mandatów.

Kliknij przycisk poniżej, aby otworzyć formularz.

⚠ Dostęp tylko dla rangi **Policjant**.`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("mandat_start")
                .setLabel("Wystaw mandat")
                .setStyle(ButtonStyle.Secondary)
        );

        await panel.send({ embeds: [embed], components: [row] });
    });

    // INTERAKCJE
    client.on("interactionCreate", async (interaction) => {

        // PRZYCISK — START
        if (interaction.isButton() && interaction.customId === "mandat_start") {

            if (!interaction.member.roles.cache.has(POLICJA_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Tylko policjant może wystawiać mandaty.",
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("mandat_modal")
                .setTitle("Wystaw mandat");

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("mandat_nick")
                        .setLabel("Nick Roblox")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("mandat_wykroczenie")
                        .setLabel("Wykroczenie")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("mandat_kwota")
                        .setLabel("Kwota mandatu ($)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );

            return interaction.showModal(modal);
        }

        // MODAL — WYSTAWIENIE MANDATU
        if (interaction.isModalSubmit() && interaction.customId === "mandat_modal") {

            const nick = interaction.fields.getTextInputValue("mandat_nick");
            const wykroczenie = interaction.fields.getTextInputValue("mandat_wykroczenie");
            const kwota = interaction.fields.getTextInputValue("mandat_kwota");

            const channel = interaction.guild.channels.cache.get(MANDATY_CHANNEL_ID);
            if (!channel) {
                return interaction.reply({
                    content: "❌ Nie znaleziono kanału mandatów.",
                    ephemeral: true
                });
            }

            const wystawiono = Date.now();
            const termin = wystawiono + (7 * 24 * 60 * 60 * 1000);

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("📄 Nowy mandat")
                .setDescription(
`**Sprawca:** ${nick}
**Wykroczenie:** ${wykroczenie}
**Kwota:** ${kwota} $

**Wystawił:** ${interaction.user}

**Czas na spłatę:** 7 dni  
**Termin spłaty:** <t:${Math.floor(termin / 1000)}:D>  
**Pozostało:** 7 dni`)
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`mandat_splac_${interaction.user.id}`)
                    .setLabel("Mandat spłacony")
                    .setStyle(ButtonStyle.Success)
            );

            await channel.send({ embeds: [embed], components: [row] });

            return interaction.reply({
                content: "✔ Mandat został wystawiony!",
                ephemeral: true
            });
        }

        // PRZYCISK — SPŁACONY
        if (interaction.isButton() && interaction.customId.startsWith("mandat_splac_")) {

            const ownerId = interaction.customId.split("_")[2];

            if (interaction.user.id !== ownerId) {
                return interaction.reply({
                    content: "❌ Tylko policjant, który wystawił mandat, może go oznaczyć jako spłacony.",
                    ephemeral: true
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("mandat_done")
                    .setLabel("✔ Mandat spłacony")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );

            await interaction.message.edit({ components: [row] });

            return interaction.reply({
                content: "✔ Mandat został oznaczony jako spłacony.",
                ephemeral: true
            });
        }
    });
};
