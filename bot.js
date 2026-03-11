const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle,
    InteractionType, StringSelectMenuBuilder,
    Partials
} = require("discord.js");
const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// ============================
// KONFIGURACJA
// ============================

const GUILD_ID = "1478750576408793239";
const CLIENT_ID = "1478769644771872818";

const VERIFY_CHANNEL_ID = "1478782389248327720";
const WELCOME_CHANNEL_ID = "1479172496627339417";
const URZAD_PANEL_CHANNEL_ID = "1479789580118130869";
const BANK_CHANNEL_ID = "1479903334751015065";
const KANTOR_CHANNEL_ID = "1479872519799574729";
const SKLEP_CHANNEL_ID = "1479872602930675923";
const ECONOMY_TABLE_CHANNEL_ID = "1480273368891658370";

const CREATE_VOICE_CHANNEL_ID = "1480286281899446314";

// ============================
// READY — PANELE BEZ DUPLIKATÓW
// ============================

client.once("ready", async () => {
    console.log(`Bot działa jako ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    async function sendOnce(channelId, payload) {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const last = await channel.messages.fetch({ limit: 1 });
        if (last.size === 0) {
            await channel.send(payload);
        }
    }

    // WERYFIKACJA
    await sendOnce(VERIFY_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Weryfikacja Roblox\nKliknij przycisk poniżej.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("start_verification")
                    .setLabel("Zweryfikuj się")
                    .setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    // URZĄD
    await sendOnce(URZAD_PANEL_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Urząd Miejski\nWybierz jedną z opcji.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("dowod_start").setLabel("Dowód").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("pj_start").setLabel("Prawo jazdy").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("urzad_pytanie").setLabel("Pytanie").setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    // BANK
    await sendOnce(BANK_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Bank\nKliknij, aby się zalogować.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("bank_login").setLabel("Zaloguj się").setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    // KANTOR
    await sendOnce(KANTOR_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Kantor\nKliknij, aby wymienić walutę.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("kantor_wymiana").setLabel("Wymień").setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    // SKLEP
    await sendOnce(SKLEP_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Sklep\nKliknij, aby otworzyć sklep.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("sklep_open").setLabel("Otwórz sklep").setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    console.log("Panele załadowane bez duplikatów.");
});

// ============================
// INTERAKCJE — WERYFIKACJA / REGULAMINY / URZĄD / BANK / KANTOR / SKLEP
// ============================

client.on("interactionCreate", async (interaction) => {

    const ignoreForTempVoice = [
        "dowod_", "pj_", "urzad_", "bank_", "kantor_", "sklep_", "verification_", "regulamin_"
    ];

    if (interaction.isButton()) {
        for (const prefix of ignoreForTempVoice) {
            if (interaction.customId.startsWith(prefix)) {
                break;
            }
        }
    }

    // WERYFIKACJA
    if (interaction.isButton() && interaction.customId === "start_verification") {
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

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "verification_modal") {
        const nick = interaction.fields.getTextInputValue("roblox_nick");
        return interaction.reply({
            content: `✅ Zweryfikowano nick Roblox: **${nick}**`,
            ephemeral: true
        });
    }

    // REGULAMINY — PRZYCISK
    if (interaction.isButton() && interaction.customId === "regulamin_przycisk") {
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
            content: "Wybierz regulamin:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }

    // REGULAMINY — WYBÓR
    if (interaction.isStringSelectMenu() && interaction.customId === "wybor_regulaminu") {
        const value = interaction.values[0];

        let title = "";
        let description = "";

        if (value === "discord") {
            title = "📜 Regulamin Discord";
            description = `
1. Zakaz obrażania innych użytkowników.
2. Zakaz spamowania na kanałach tekstowych i głosowych.
3. Zakaz reklamowania innych serwerów bez zgody administracji.
4. Zakaz używania wulgarnych nicków, avatarów i statusów.
5. Słuchaj poleceń administracji – ich decyzja jest ostateczna.
            `;
        }

        if (value === "roblox") {
            title = "📜 Regulamin Roblox";
            description = `
1. Zakaz używania cheatów, exploitów i skryptów dających przewagę.
2. Zakaz wykorzystywania bugów gry – każdy bug zgłaszamy administracji.
3. Zakaz podszywania się pod innych graczy lub administrację.
4. Zakaz handlu poza oficjalnymi systemami serwera.
5. Graj fair play – szanuj innych graczy.
            `;
        }

        if (value === "taryfikator_discord") {
            title = "⚖️ Taryfikator kar – Discord";
            description = `
• Spam – ostrzeżenie / mute czasowy  
• Obraza użytkownika – mute / ban czasowy  
• Reklama bez zgody – natychmiastowy ban  
• Udostępnianie treści NSFW – ban  
• Omijanie kar – przedłużenie lub stały ban
            `;
        }

        if (value === "taryfikator_roblox") {
            title = "⚖️ Taryfikator kar – Roblox";
            description = `
• Cheaty / exploity – natychmiastowy ban  
• Wykorzystywanie bugów – ban / reset progresu  
• Toxic zachowanie – mute / kick / ban  
• Scamowanie graczy – stały ban  
• Multi-konta do oszukiwania systemu – ban wszystkich kont
            `;
        }

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle(title)
            .setDescription(description);

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    // URZĄD — DOWÓD
    if (interaction.isButton() && interaction.customId === "dowod_start") {
        const modal = new ModalBuilder()
            .setCustomId("dowod_modal")
            .setTitle("Wniosek o dowód osobisty");

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("dowod_imie").setLabel("Imię").setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("dowod_nazwisko").setLabel("Nazwisko").setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("dowod_plec").setLabel("Płeć").setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("dowod_obywatelstwo").setLabel("Obywatelstwo").setStyle(TextInputStyle.Short).setRequired(true)
            )
        );

        return interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "dowod_modal") {
        return interaction.reply({
            content: "✅ Wniosek o dowód został złożony.",
            ephemeral: true
        });
    }

    // URZĄD — PRAWO JAZDY
    if (interaction.isButton() && interaction.customId === "pj_start") {
        const menu = new StringSelectMenuBuilder()
            .setCustomId("pj_kategoria")
            .setPlaceholder("Wybierz kategorię prawa jazdy")
            .addOptions(
                { label: "B", value: "B" },
                { label: "A", value: "A" },
                { label: "C", value: "C" },
                { label: "C+E", value: "CE" },
                { label: "D", value: "D" },
                { label: "T", value: "T" }
            );

        return interaction.reply({
            content: "Wybierz kategorię prawa jazdy:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "pj_kategoria") {
        const kat = interaction.values[0];
        return interaction.reply({
            content: `🚗 Ticket dla kategorii **${kat}** został utworzony.`,
            ephemeral: true
        });
    }

    // BANK
    if (interaction.isButton() && interaction.customId === "bank_login") {
        const modal = new ModalBuilder()
            .setCustomId("bank_login_modal")
            .setTitle("Logowanie do banku");

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("bank_pin").setLabel("PIN (4 cyfry)").setStyle(TextInputStyle.Short).setRequired(true)
            )
        );

        return interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "bank_login_modal") {
        return interaction.reply({
            content: "💰 Zalogowano do banku.",
            ephemeral: true
        });
    }

    // KANTOR
    if (interaction.isButton() && interaction.customId === "kantor_wymiana") {
        return interaction.reply({
            content: "💱 Ticket kantoru został utworzony.",
            ephemeral: true
        });
    }

    // SKLEP
    if (interaction.isButton() && interaction.customId === "sklep_open") {
        return interaction.reply({
            content: "🛒 Sklep otwarty (tu wstaw listę produktów).",
            ephemeral: true
        });
    }
});

// ============================
// POWITANIE
// ============================

client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("<:osoba:1479761131206611078> Nowy gracz na serwerze!")
        .setDescription(`Witaj ${member.user}, cieszymy się, że dołączyłeś do naszej społeczności! <:rakieta:1479760849835917342>
Pamiętaj, aby przejść weryfikację i zapoznać się z regulaminem.`)
        .setThumbnail(member.user.displayAvatarURL());

    await channel.send({ embeds: [embed] });
});

// ============================
// TEMP VOICE
// ============================

const tempVoice = new Map(); // userId -> { channelId, banned: Set() }

client.on("voiceStateUpdate", async (oldState, newState) => {
    const guild = newState.guild;
    const member = newState.member;

    // WEJŚCIE DO KANAŁU "STWÓRZ KANAŁ"
    if (newState.channelId === CREATE_VOICE_CHANNEL_ID) {

        if (tempVoice.has(member.id)) return;

        const channel = await guild.channels.create({
            name: `kanał-${member.user.username}`,
            type: 2,
            parent: newState.channel.parentId,
            permissionOverwrites: [
                { id: guild.id, deny: ["ViewChannel"] },
                { id: member.id, allow: ["ViewChannel", "Connect", "Speak"] }
            ]
        });

        tempVoice.set(member.id, {
            channelId: channel.id,
            banned: new Set()
        });

        await member.voice.setChannel(channel);

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`pv_private_${member.id}`).setLabel("🔒 Prywatny").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`pv_public_${member.id}`).setLabel("🔓 Publiczny").setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`pv_kick_${member.id}`).setLabel("👢 Wyrzuć").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`pv_ban_${member.id}`).setLabel("⛔ Zbanuj").setStyle(ButtonStyle.Secondary)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`pv_limit_${member.id}`).setLabel("🎚 Limit osób").setStyle(ButtonStyle.Secondary)
        );

        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("Panel zarządzania kanałem")
                    .setDescription("Tylko właściciel kanału może używać przycisków.")
            ],
            components: [row1, row2, row3]
        });
    }

    // WYJŚCIE Z KANAŁU — AUTO DELETE
    if (oldState.channelId) {
        const channel = oldState.channel;
        if (!channel) return;

        const ownerEntry = [...tempVoice.entries()]
            .find(([_, data]) => data.channelId === channel.id);

        if (!ownerEntry) return;

        const [ownerId] = ownerEntry;

        if (channel.members.size === 0) {
            await channel.delete().catch(() => {});
            tempVoice.delete(ownerId);
        }
    }
});

// PRZYCISKI PANELU TEMP-VOICE

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("pv_")) return;

    const parts = interaction.customId.split("_");
    const action = parts[1];
    const ownerId = parts[2];

    if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: "❌ Nie jesteś właścicielem kanału.", ephemeral: true });
    }

    const data = tempVoice.get(ownerId);
    if (!data) return;

    const channel = interaction.guild.channels.cache.get(data.channelId);
    if (!channel) return;

    if (action === "private") {
        await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
        return interaction.reply({ content: "🔒 Kanał ustawiony na prywatny.", ephemeral: true });
    }

    if (action === "public") {
        await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: true });
        return interaction.reply({ content: "🔓 Kanał ustawiony na publiczny.", ephemeral: true });
    }

    if (action === "kick") {
        const members = [...channel.members.values()].filter(m => m.id !== ownerId);

        if (members.length === 0) {
            return interaction.reply({ content: "❌ Nie ma kogo wyrzucić.", ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`pv_kick_select_${ownerId}`)
            .setPlaceholder("Wybierz osobę do wyrzucenia")
            .addOptions(members.map(m => ({ label: m.user.username, value: m.id })));

        return interaction.reply({
            content: "Wybierz osobę:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }

    if (action === "ban") {
        const members = [...channel.members.values()].filter(m => m.id !== ownerId);

        if (members.length === 0) {
            return interaction.reply({ content: "❌ Nie ma kogo zbanować.", ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`pv_ban_select_${ownerId}`)
            .setPlaceholder("Wybierz osobę do zbanowania")
            .addOptions(members.map(m => ({ label: m.user.username, value: m.id })));

        return interaction.reply({
            content: "Wybierz osobę:",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }

    if (action === "limit") {
        const modal = new ModalBuilder()
            .setCustomId(`pv_limit_modal_${ownerId}`)
            .setTitle("Ustaw limit osób");

        const input = new TextInputBuilder()
            .setCustomId("limit_value")
            .setLabel("Podaj limit (1–99)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
    }
});

// SELECT MENU — WYRZUCANIE / BANOWANIE

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith("pv_")) return;

    const parts = interaction.customId.split("_");
    const action = parts[1];
    const ownerId = parts[parts.length - 1];

    if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: "❌ Nie jesteś właścicielem kanału.", ephemeral: true });
    }

    const data = tempVoice.get(ownerId);
    if (!data) return;

    const channel = interaction.guild.channels.cache.get(data.channelId);
    if (!channel) return;

    const targetId = interaction.values[0];
    const target = channel.members.get(targetId);

    if (action === "kick") {
        if (target) await target.voice.disconnect();
        return interaction.reply({ content: `👢 Wyrzucono <@${targetId}>.`, ephemeral: true });
    }

    if (action === "ban") {
        data.banned.add(targetId);
        await channel.permissionOverwrites.edit(targetId, { Connect: false });
        if (target) await target.voice.disconnect();
        return interaction.reply({ content: `⛔ Zbanowano <@${targetId}> z tego kanału.`, ephemeral: true });
    }
});

// LIMIT — MODAL

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith("pv_limit_modal")) return;

    const ownerId = interaction.customId.split("_").pop();

    if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: "❌ Nie jesteś właścicielem kanału.", ephemeral: true });
    }

    const data = tempVoice.get(ownerId);
    if (!data) return;

    const channel = interaction.guild.channels.cache.get(data.channelId);
    if (!channel) return;

    const limit = parseInt(interaction.fields.getTextInputValue("limit_value"));

    if (isNaN(limit) || limit < 1 || limit > 99) {
        return interaction.reply({ content: "❌ Limit musi być liczbą 1–99.", ephemeral: true });
    }

    await channel.setUserLimit(limit);

    return interaction.reply({ content: `🎚 Ustawiono limit na **${limit}** osób.`, ephemeral: true });
});

// ============================
// START BOTA
// ============================

client.login(process.env.TOKEN);
