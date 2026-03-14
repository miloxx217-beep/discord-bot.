const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    InteractionType
} = require("discord.js");

module.exports = (client, shared) => {
    const {
        config,
        loadBankData,
        saveBankData,
        getUserAccount,
        setUserAccount,
        loggedInUsers
    } = shared;

    // READY – panele bank/kantor/sklep
    client.once("ready", async () => {
        const guild = client.guilds.cache.get(config.GUILD_ID);
        if (!guild) return;

        // BANK
        const bankChannel = guild.channels.cache.get(config.BANK_CHANNEL_ID);
        if (bankChannel) {
            const embedBank = new EmbedBuilder()
                .setColor("Orange")
                .setDescription("# <:mlot:1479760749541855362> Bank");
            const rowBank = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_login")
                    .setLabel("Zaloguj się")
                    .setStyle(ButtonStyle.Secondary)
            );
            await bankChannel.send({ embeds: [embedBank], components: [rowBank] });
        }

        // KANTOR
        const kantorChannel = guild.channels.cache.get(config.KANTOR_CHANNEL_ID);
        if (kantorChannel) {
            const embedKantor = new EmbedBuilder()
                .setColor("Orange")
                .setDescription("# Kantor Wymiany Walut");
            const rowKantor = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("kantor_wymiana")
                    .setLabel("Wymień walutę")
                    .setStyle(ButtonStyle.Secondary)
            );
            await kantorChannel.send({ embeds: [embedKantor], components: [rowKantor] });
        }

        // SKLEP
        const sklepChannel = guild.channels.cache.get(config.SKLEP_CHANNEL_ID);
        if (sklepChannel) {
            const embedSklep = new EmbedBuilder()
                .setColor("Orange")
                .setDescription("# Sklep");
            const rowSklep = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("sklep_open")
                    .setLabel("Otwórz sklep")
                    .setStyle(ButtonStyle.Secondary)
            );
            await sklepChannel.send({ embeds: [embedSklep], components: [rowSklep] });
        }
    });

    // PRZYCISKI – bank/kantor/sklep
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        // BANK LOGIN
        if (interaction.customId === "bank_login") {
            const account = getUserAccount(interaction.user.id);

            if (!account) {
                const modal = new ModalBuilder()
                    .setCustomId("bank_create_modal")
                    .setTitle("Utwórz konto bankowe");

                const pinInput = new TextInputBuilder()
                    .setCustomId("bank_pin")
                    .setLabel("Ustaw 4-cyfrowy PIN")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(pinInput));
                return interaction.showModal(modal);
            } else {
                const modal = new ModalBuilder()
                    .setCustomId("bank_login_modal")
                    .setTitle("Logowanie do banku");

                const pinInput = new TextInputBuilder()
                    .setCustomId("bank_pin_login")
                    .setLabel("Podaj swój 4-cyfrowy PIN")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(pinInput));
                return interaction.showModal(modal);
            }
        }

        // BANK MENU
        if (interaction.customId === "bank_menu") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany do banku.",
                    ephemeral: true
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_saldo")
                    .setLabel("Sprawdź saldo")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("bank_przelew")
                    .setLabel("Przelej pieniądze")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "Wybierz operację:",
                components: [row],
                ephemeral: true
            });
        }

        // KANTOR – otwarcie ticketu, realizacja, zamknięcie
        // SKLEP – otwarcie
        // (tu możesz wkleić 1:1 swoje istniejące fragmenty z obecnego bota)
    });

    // MODALE – bank_create, bank_login, bank_transfer, kantor_modal
    client.on("interactionCreate", async (interaction) => {
        if (interaction.type !== InteractionType.ModalSubmit) return;

        // tu wklejasz swoje istniejące obsługi modali banku i kantoru
    });
};
