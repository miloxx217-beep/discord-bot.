const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    Routes
} = require("discord.js");

module.exports = (client, shared) => {
    const { config, rest } = shared;

    const slashCommands = [
        // /pracuj i /dodajkase rejestrujemy w innym module – tu tylko przykład,
        // możesz zostawić puste, jeśli chcesz
    ].map(cmd => cmd.toJSON ? cmd.toJSON() : cmd);

    client.once("ready", async () => {
        console.log(`Bot działa jako ${client.user.tag}`);

        try {
            await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
                { body: slashCommands }
            );
        } catch (err) {
            console.error("Błąd przy rejestracji komend:", err);
        }

        const guild = client.guilds.cache.get(config.GUILD_ID);
        if (!guild) return;

        // WERYFIKACJA
        const verifyChannel = guild.channels.cache.get(config.VERIFY_CHANNEL_ID);
        if (verifyChannel) {
            const embedVerify = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:konfetti:1479760987790770288> Weryfikacja Roblox 

Kliknij przycisk znajdujący się poniżej, aby wprowadzić swój prawidłowy nick Roblox — wymagamy nazwy konta, a nie display name.
Informacja ta jest potrzebna, abyśmy mogli poprawnie przeprowadzić proces weryfikacji i upewnić się, że podane dane są zgodne z Twoim profilem w grze.
Prosimy o dokładne wpisanie nicku, z zachowaniem wielkości liter oraz pełnej pisowni, ponieważ wszelkie błędy mogą spowodować konieczność ponownego przejścia weryfikacji.`);

            const rowVerify = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("start_verification")
                    .setLabel("Zweryfikuj się")
                    .setStyle(ButtonStyle.Secondary)
            );

            await verifyChannel.send({ embeds: [embedVerify], components: [rowVerify] });
        }

        // URZĄD
        const urzadChannel = guild.channels.cache.get(config.URZAD_PANEL_CHANNEL_ID);
        if (urzadChannel) {
            const embedUrzad = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:mod:1479847501149372467> Urząd Miejski   
Witaj w oficjalnym panelu Urzędu Miejskiego.

• Dowód osobisty  
• Prawo jazdy  
• Zapytanie do urzędu`);

            const rowUrzad = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("dowod_start")
                    .setLabel("Dowód osobisty")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("pj_start")
                    .setLabel("Prawo jazdy")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("urzad_pytanie")
                    .setLabel("Zapytanie do urzędu")
                    .setStyle(ButtonStyle.Secondary)
            );

            await urzadChannel.send({ embeds: [embedUrzad], components: [rowUrzad] });
        }
    });

    // MESSAGE – regulamin
    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        if (message.content === "!regulamin") {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:koperta:1479760548500471830> Regulamin serwera

Kliknij przycisk poniżej i wybierz regulamin który chcesz przeczytać.`);

            const button = new ButtonBuilder()
                .setCustomId("regulamin_przycisk")
                .setLabel("Zobacz regulaminy")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(button);
            await message.channel.send({ embeds: [embed], components: [row] });
        }

        if (message.content === "!ping") {
            await message.channel.send("Pong! <:rakieta:1479760849835917342> Bot działa!");
        }
    });

    // INTERAKCJE – przyciski: weryfikacja, regulamin, urząd (bez dowodu – ten w osobnym module)
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        // WERYFIKACJA
        if (interaction.customId === "start_verification") {
            const modal = new ModalBuilder()
                .setCustomId("verification_modal")
                .setTitle("Weryfikacja Roblox");

            const input = new TextInputBuilder()
                .setCustomId("roblox_nick")
                .setLabel("Twój nick Roblox")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return interaction.showModal(modal);
        }

        // REGULAMINY
        if (interaction.customId === "regulamin_przycisk") {
            const menu = new StringSelectMenuBuilder()
                .setCustomId("wybor_regulaminu")
                .setPlaceholder("Wybierz regulamin")
                .addOptions(
                    { label: "Regulamin Discord", value: "discord" },
                    { label: "Regulamin Roblox", value: "roblox" },
                    { label: "Taryfikator Discord", value: "taryfikator_discord" },
                    { label: "Taryfikator Roblox", value: "taryfikator_roblox" }
                );

            return interaction.reply({
                content: "Wybierz co chcesz przeczytać:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // PRAWO JAZDY – start
        if (interaction.customId === "pj_start") {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("<:koperta:1479760548500471830> Wniosek o prawo jazdy")
                .setDescription("Wybierz kategorię prawa jazdy.");

            const menu = new StringSelectMenuBuilder()
                .setCustomId("pj_kategoria")
                .setPlaceholder("Wybierz kategorię prawa jazdy")
                .addOptions(
                    { label: "Kategoria B", value: "B" },
                    { label: "Kategoria A", value: "A" },
                    { label: "Kategoria C", value: "C" },
                    { label: "Kategoria C+E", value: "CE" },
                    { label: "Kategoria D", value: "D" },
                    { label: "Kategoria T", value: "T" }
                );

            return interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // PYTANIE DO URZĘDU – ticket
        if (interaction.customId === "urzad_pytanie") {
            const ticket = await interaction.guild.channels.create({
                name: `pytanie-${interaction.user.username}`,
                type: 0,
                parent: config.URZAD_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription("# <:osoba:1479761131206611078> Pytanie do urzędu");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_accept")
                    .setLabel("Przyjmij zgłoszenie")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("Zamknij ticket")
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });

            return interaction.reply({
                content: "Ticket został utworzony!",
                ephemeral: true
            });
        }
    });
};
