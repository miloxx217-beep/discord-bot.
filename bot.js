const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    InteractionType, StringSelectMenuBuilder,
    Partials, REST, Routes, SlashCommandBuilder
} = require("discord.js");
const fs = require("fs");

// ============================
// KONFIGURACJA
// ============================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates // DODANE DO AUTOKANAŁÓW
    ],
    partials: [Partials.Channel]
});

const GUILD_ID = "1478750576408793239";
const CLIENT_ID = "1478769644771872818";

const VERIFY_CHANNEL_ID = "1478782389248327720";
const ADMIN_CHANNEL_ID = "1478787933350658138";
const WELCOME_CHANNEL_ID = "1479172496627339417";
const URZAD_CATEGORY_ID = "1479814526588420137";
const URZAD_PANEL_CHANNEL_ID = "1479789580118130869";
const DOWODY_CHANNEL_ID = "1479848426295267470";
const EGZAMINATOR_ROLE_ID = "1479868039636844544";

const BANK_CHANNEL_ID = "1479903334751015065";
const KANTOR_CHANNEL_ID = "1479872519799574729";
const SKLEP_CHANNEL_ID = "1479872602930675923";
const PRACUJ_CHANNEL_ID = "1479872708928864388";

const KANTOR_TICKET_CATEGORY_ID = "1480134306495201300";
const WLASCICIEL_ROLE_ID = "1478754923142316276";

const PREMIUM_ROLE_ID = "1479920896759173377";
const PJ_B_ROLE_ID = "1479920137749401752";
const PJ_A_ROLE_ID = "1479920273225678918";
const PJ_T_ROLE_ID = "1479920305743986951";
const PJ_C_ROLE_ID = "1479920339248091146";
const PJ_D_ROLE_ID = "1479920368360755415";
const PJ_CE_ROLE_ID = "1479920394831003892";

// AUTOKANAŁY — NOWE
const CREATE_VOICE_CHANNEL_ID = "1480286281899446314";

// cooldown /pracuj
const workCooldown = new Map();

// ============================
// DOWODY
// ============================
let dowodCounter = 0;

if (fs.existsSync("dowody_counter.txt")) {
    const val = fs.readFileSync("dowody_counter.txt", "utf8").trim();
    if (val) dowodCounter = parseInt(val, 10) || 0;
}

function saveDowodCounter() {
    fs.writeFileSync("dowody_counter.txt", String(dowodCounter));
}

let usersWithID = new Set();

if (fs.existsSync("dowody.txt")) {
    const lines = fs.readFileSync("dowody.txt", "utf8").split("\n");
    for (const line of lines) {
        if (line.trim().length > 0) usersWithID.add(line.trim());
    }
}

function saveUserID(userId) {
    fs.appendFileSync("dowody.txt", userId + "\n");
}

// ============================
// BANK
// ============================
const BANK_FILE = "bank.txt"; // userId|pin|balance
const loggedInUsers = new Set();

function loadBankData() {
    if (!fs.existsSync(BANK_FILE)) return {};
    const lines = fs.readFileSync(BANK_FILE, "utf8").split("\n");
    const data = {};
    for (const line of lines) {
        if (!line.trim()) continue;
        const [id, pin, balance] = line.split("|");
        data[id] = { pin, balance: Number(balance) || 0 };
    }
    return data;
}

function saveBankData(data) {
    const lines = [];
    for (const id in data) {
        lines.push(`${id}|${data[id].pin}|${data[id].balance}`);
    }
    fs.writeFileSync(BANK_FILE, lines.join("\n"));
}

function getUserAccount(userId) {
    const data = loadBankData();
    return data[userId] || null;
}

function setUserAccount(userId, pin, balance) {
    const data = loadBankData();
    data[userId] = { pin, balance };
    saveBankData(data);
}

// ============================
// SLASH KOMENDY
// ============================
const slashCommands = [
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
                .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// ============================
// READY — NAPRAWIONE (BEZ DUPLIKATÓW PANELI)
// ============================
client.once("ready", async () => {
    console.log(`Bot działa jako ${client.user.tag}`);

    try {
        console.log("Rejestrowanie komend slash...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: slashCommands }
        );
        console.log("Komendy slash zarejestrowane!");
    } catch (err) {
        console.error("Błąd przy rejestracji komend:", err);
    }

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
                .setDescription(
`# <:konfetti:1479760987790770288> Weryfikacja Roblox 

Kliknij przycisk znajdujący się poniżej, aby wprowadzić swój prawidłowy nick Roblox — wymagamy nazwy konta, a nie display name.
Informacja ta jest potrzebna, abyśmy mogli poprawnie przeprowadzić proces weryfikacji.`)
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
                .setDescription(
`# <:mod:1479847501149372467> Urząd Miejski   
Witaj w oficjalnym panelu Urzędu Miejskiego.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("dowod_start").setLabel("Dowód osobisty").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("pj_start").setLabel("Prawo jazdy").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("urzad_pytanie").setLabel("Zapytanie do urzędu").setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    // BANK
    await sendOnce(BANK_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Bank — kliknij, aby się zalogować.`)
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
                .setDescription(`# Kantor — wymień walutę.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("kantor_wymiana").setLabel("Wymień walutę").setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    // SKLEP
    await sendOnce(SKLEP_CHANNEL_ID, {
        embeds: [
            new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`# Sklep — kliknij, aby otworzyć.`)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("sklep_open").setLabel("Otwórz sklep").setStyle(ButtonStyle.Secondary)
            )
        ]
    });
});
// ============================
// MESSAGE
// ============================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!regulamin") {
        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:koperta:1479760548500471830> Regulamin serwera

Kliknij przycisk poniżej i wybierz regulamin który chcesz przeczytać.

Dostępne:
• Regulamin Discord
• Regulamin Roblox
• Taryfikator Discord
• Taryfikator Roblox

Nieznajomość regulaminu nie zwalnia z jego przestrzegania.`);

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

// ============================
// INTERAKCJE
// ============================
client.on("interactionCreate", async (interaction) => {

    // PRZYCISKI
    if (interaction.isButton()) {

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

        // DOWÓD
        if (interaction.customId === "dowod_start") {
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
        }

        // PRAWO JAZDY
        if (interaction.customId === "pj_start") {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("<:koperta:1479760548500471830> Wniosek o prawo jazdy")
                .setDescription(
`Poniżej wybierz kategorię prawa jazdy, o którą chcesz złożyć wniosek.

- Wymagane jest wcześniejsze zakupienie odpowiedniego prawa jazdy w sklepie serwera.  
- Po wybraniu kategorii zostanie utworzony specjalny ticket.`);

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

        // PYTANIE DO URZĘDU
        if (interaction.customId === "urzad_pytanie") {
            const ticket = await interaction.guild.channels.create({
                name: `pytanie-${interaction.user.username}`,
                type: 0,
                parent: URZAD_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:osoba:1479761131206611078> Pytanie do urzędu

Opisz swój problem lub pytanie.`);

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

        // PRZYJĘCIE ZGŁOSZENIA
        if (interaction.customId === "ticket_accept") {
            if (
                !interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID) &&
                !interaction.member.roles.cache.has(EGZAMINATOR_ROLE_ID)
            ) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            if (interaction.message.components[0].components.length === 1) {
                return interaction.reply({
                    content: "❗ To zgłoszenie zostało już przyjęte wcześniej.",
                    ephemeral: true
                });
            }

            const newRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("Zamknij ticket")
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.message.edit({ components: [newRow] });

            return interaction.reply({
                content: `<:ptaszek:1479761065850962020> Zgłoszenie zostało przyjęte przez ${interaction.user}.`,
                ephemeral: false
            });
        }

        // ZAMKNIĘCIE TICKETA
        if (interaction.customId === "ticket_close") {
            if (
                !interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID) &&
                !interaction.member.roles.cache.has(EGZAMINATOR_ROLE_ID)
            ) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            return interaction.channel.delete();
        }
            return interaction.reply({
                content: "Twój wniosek o dowód został wysłany!",
                ephemeral: true
            });
        }

        // BANK — TWORZENIE KONTA
        if (interaction.customId === "bank_create_modal") {
            const pin = interaction.fields.getTextInputValue("bank_pin").trim();

            if (!/^\d{4}$/.test(pin)) {
                return interaction.reply({
                    content: "❌ PIN musi składać się z dokładnie 4 cyfr.",
                    ephemeral: true
                });
            }

            const existing = getUserAccount(interaction.user.id);
            if (existing) {
                return interaction.reply({
                    content: "❌ Masz już konto bankowe.",
                    ephemeral: true
                });
            }

            setUserAccount(interaction.user.id, pin, 0);
            loggedInUsers.add(interaction.user.id);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_menu")
                    .setLabel("Otwórz menu banku")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "✅ Konto bankowe zostało utworzone. Jesteś zalogowany.",
                components: [row],
                ephemeral: true
            });
        }

        // BANK — LOGOWANIE
        if (interaction.customId === "bank_login_modal") {
            const pin = interaction.fields.getTextInputValue("bank_pin_login").trim();
            const account = getUserAccount(interaction.user.id);

            if (!account) {
                return interaction.reply({
                    content: "❌ Nie masz konta bankowego.",
                    ephemeral: true
                });
            }

            if (account.pin !== pin) {
                return interaction.reply({
                    content: "❌ Nieprawidłowy PIN.",
                    ephemeral: true
                });
            }

            loggedInUsers.add(interaction.user.id);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_menu")
                    .setLabel("Otwórz menu banku")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "✅ Zalogowano do banku.",
                components: [row],
                ephemeral: true
            });
        }

        // BANK — PRZELEW
        if (interaction.customId === "bank_transfer_modal") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany do banku.",
                    ephemeral: true
                });
            }

            const targetRaw = interaction.fields.getTextInputValue("bank_transfer_target").trim();
            const amountRaw = interaction.fields.getTextInputValue("bank_transfer_amount").trim();

            const amount = Number(amountRaw);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({
                    content: "❌ Kwota musi być dodatnią liczbą.",
                    ephemeral: true
                });
            }

            let targetId = targetRaw;
            const mentionMatch = targetRaw.match(/^<@!?(\d+)>$/);
            if (mentionMatch) targetId = mentionMatch[1];

            if (targetId === interaction.user.id) {
                return interaction.reply({
                    content: "❌ Nie możesz przelać pieniędzy samemu sobie.",
                    ephemeral: true
                });
            }

            const senderAcc = getUserAccount(interaction.user.id);
            if (!senderAcc) {
                return interaction.reply({
                    content: "❌ Nie masz konta bankowego.",
                    ephemeral: true
                });
            }

            if (senderAcc.balance < amount) {
                return interaction.reply({
                    content: "❌ Nie masz wystarczających środków.",
                    ephemeral: true
                });
            }

            const targetAcc = getUserAccount(targetId);
            if (!targetAcc) {
                return interaction.reply({
                    content: "❌ Odbiorca nie ma konta bankowego.",
                    ephemeral: true
                });
            }

            const data = loadBankData();
            data[interaction.user.id].balance -= amount;
            data[targetId].balance += amount;
            saveBankData(data);

            return interaction.reply({
                content: `✅ Przelano ${amount} $ do <@${targetId}>.`,
                ephemeral: true
            });
        }

        // KANTOR — MODAL (REALIZACJA)
        if (interaction.customId === "kantor_modal") {

            if (!interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Nie masz uprawnień.",
                    ephemeral: true
                });
            }

            const userId = interaction.fields.getTextInputValue("kantor_id");
            const kwotaRaw = interaction.fields.getTextInputValue("kantor_kwota");
            const kwota = Number(kwotaRaw);

            if (isNaN(kwota) || kwota <= 0) {
                return interaction.reply({
                    content: "❌ Kwota musi być liczbą dodatnią.",
                    ephemeral: true
                });
            }

            const account = getUserAccount(userId);
            if (!account) {
                return interaction.reply({
                    content: "❌ Ten użytkownik nie ma konta bankowego.",
                    ephemeral: true
                });
            }

            const data = loadBankData();
            data[userId].balance += kwota;
            saveBankData(data);

            await interaction.channel.send(
                `Realizacja kantoru\nUżytkownik <@${userId}> otrzymał ${kwota}$.`
            );

            return interaction.reply({
                content: "✔ Kantor został zrealizowany.",
                ephemeral: true
            });
        }

    // ============================
    // SELECT MENU
    // ============================
    if (interaction.isStringSelectMenu()) {

        // REGULAMINY
        if (interaction.customId === "wybor_regulaminu") {
            const value = interaction.values[0];

            if (value === "discord") {
                return interaction.reply({
                    content:
`Regulamin Discord

1. Zachowuj się kulturalnie i z szacunkiem wobec innych.
2. Zabronione jest obrażanie, wyzywanie i grożenie innym.
3. Spamowanie lub floodowanie jest niedozwolone.
4. Korzystaj z kanałów zgodnie z ich przeznaczeniem.
5. Nie publikuj treści NSFW ani materiałów nielegalnych.`,
                    ephemeral: true
                });
            }

            if (value === "roblox") {
                return interaction.reply({
                    content:
`Regulamin Roblox

1.1 Zachowuj się kulturalnie i z szacunkiem wobec innych.
1.2 Zabronione jest obrażanie, wyzywanie i grożenie innym.
1.3 Spamowanie lub floodowanie → niedozwolone.

2. Roleplay / Postacie
2.1 Odgrywaj swoją postać spójnie i logicznie.
2.2 Tworzenie postaci powinno być zgodne z zasadami serwera.

3. Kanały i komunikacja
3.1 Korzystaj z kanałów zgodnie z ich przeznaczeniem.
3.2 Zachowuj kulturę na kanałach głosowych.
3.3 Nie publikuj treści NSFW ani materiałów nielegalnych.

4. Treści, reklama i administracja
4.1 Materiały i linki muszą być legalne.
4.2 Reklama bez zgody administracji jest zabroniona.
4.3 Postępuj zgodnie z poleceniami administracji i moderatorów.`,
                    ephemeral: true
                });
            }

            if (value === "taryfikator_discord") {
                return interaction.reply({
                    content:
`Taryfikator Discord

1. Zachowanie ogólne
1.1 Obraźliwe zachowanie → Ostrzeżenie
1.2 Powtarzające się wykroczenia → Tymczasowe wyciszenie
1.3 Spam / flood → Ostrzeżenie

2. Roleplay / Postacie
2.1 Nieprzestrzeganie zasad RP → Ostrzeżenie
2.2 Tworzenie postaci niezgodnie z zasadami → Ostrzeżenie

3. Kanały i komunikacja
3.1 Nieodpowiednie użycie kanałów → Tymczasowe wyciszenie
3.2 Zakłócanie rozmów głosowych → Ostrzeżenie
3.3 Publikowanie treści NSFW / nielegalnych → PERMANENTNY BAN

4. Treści i materiały / Reklama / Administracja
4.1 Udostępnianie nielegalnych linków → PERMANENTNY BAN
4.2 Nieautoryzowana reklama → PERMANENTNY BAN
4.3 Lekceważenie poleceń administracji → Ostrzeżenie / czasowy ban`,
                    ephemeral: true
                });
            }

            if (value === "taryfikator_roblox") {
                return interaction.reply({
                    content:
`Taryfikator Roblox

1. FRP – 1 dzień bana  
2. RDM – 1–3 dni bana  
3. VDM – 1–3 dni bana  
4. Power Gaming – 3 dni bana  
5. Meta Gaming – 3 dni bana  
6. Cheaty / Exploity – permanentny ban  
7. Podszywanie się pod administrację – 7 dni bana  
8. Reklama / phishing – permanentny ban`,
                    ephemeral: true
                });
            }
        }

        // PRAWO JAZDY — TICKET
        if (interaction.customId === "pj_kategoria") {
            const ticket = await interaction.guild.channels.create({
                name: `prawojazdy-${interaction.user.username}`,
                type: 0,
                parent: URZAD_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: EGZAMINATOR_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:koperta:1479760548500471830> Wniosek o prawo jazdy

Dziękujemy za złożenie wniosku o wydanie prawa jazdy.
Egzaminator skontaktuje się z Tobą w ciągu 24 godzin.`);

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

        // SKLEP — ZAKUP
        if (interaction.customId === "sklep_select") {
            const choice = interaction.values[0];
            const account = getUserAccount(interaction.user.id);

            if (!account) {
                return interaction.reply({
                    content: "❌ Nie masz konta bankowego.",
                    ephemeral: true
                });
            }

            const prices = {
                "premium_8000": 8000,
                "pj_B_3500": 3500,
                "pj_A_3000": 3000,
                "pj_T_2000": 2000,
                "pj_C_4000": 4000,
                "pj_D_4500": 4500,
                "pj_CE_5000": 5000
            };

            const names = {
                "premium_8000": "Ranga Premium",
                "pj_B_3500": "Prawo jazdy B",
                "pj_A_3000": "Prawo jazdy A",
                "pj_T_2000": "Prawo jazdy T",
                "pj_C_4000": "Prawo jazdy C",
                "pj_D_4500": "Prawo jazdy D",
                "pj_CE_5000": "Prawo jazdy C+E"
            };

            const roles = {
                "premium_8000": PREMIUM_ROLE_ID,
                "pj_B_3500": PJ_B_ROLE_ID,
                "pj_A_3000": PJ_A_ROLE_ID,
                "pj_T_2000": PJ_T_ROLE_ID,
                "pj_C_4000": PJ_C_ROLE_ID,
                "pj_D_4500": PJ_D_ROLE_ID,
                "pj_CE_5000": PJ_CE_ROLE_ID
            };

            const price = prices[choice];
            const name = names[choice];
            const roleId = roles[choice];

            if (account.balance < price) {
                return interaction.reply({
                    content: `❌ Nie masz wystarczających środków. Potrzebujesz ${price} $.`,
                    ephemeral: true
                });
            }

            const data = loadBankData();
            data[interaction.user.id].balance -= price;
            saveBankData(data);

            const role = interaction.guild.roles.cache.get(roleId);
            if (role) {
                await interaction.member.roles.add(role);
            }

            return interaction.reply({
                content: `✅ Zakupiono: ${name} za ${price} $.`,
                ephemeral: true
            });
        }
    }

    // ============================
    // SLASH KOMENDY
    // ============================
    if (interaction.isChatInputCommand()) {

        // /pracuj
        if (interaction.commandName === "pracuj") {

            const account = getUserAccount(interaction.user.id);
            if (!account) {
                return interaction.reply({
                    content: "❌ Nie masz konta bankowego. Najpierw zaloguj się w kanale bank.",
                    ephemeral: true
                });
            }

            const lastWork = workCooldown.get(interaction.user.id);
            const now = Date.now();
            const hour = 60 * 60 * 1000;

            if (lastWork && now - lastWork < hour) {
                const remaining = hour - (now - lastWork);
                const minutes = Math.ceil(remaining / 60000);

                return interaction.reply({
                    content: `⏳ Możesz ponownie pracować za ${minutes} minut.`,
                    ephemeral: true
                });
            }

            workCooldown.set(interaction.user.id, now);

            const amount = Math.floor(Math.random() * (400 - 30 + 1)) + 30;

            const data = loadBankData();
            data[interaction.user.id].balance += amount;
            saveBankData(data);

            const guild = interaction.guild;
            const workChannel = guild.channels.cache.get(PRACUJ_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("Praca wykonana")
                .setDescription(
                    `${interaction.user} wykonał pracę.\n\nOtrzymał: ${amount} $\nNowe saldo: ${data[interaction.user.id].balance} $`
                )
                .setThumbnail(interaction.user.displayAvatarURL());

            if (workChannel) {
                await workChannel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: "✅ Twoja praca została zarejestrowana. Sprawdź kanał pracy, aby zobaczyć szczegóły.",
                ephemeral: true
            });
        }

        // /dodajkase — tylko właściciel
        if (interaction.commandName === "dodajkase") {

            if (!interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Nie masz uprawnień do tej komendy.",
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser("uzytkownik");
            const kwota = interaction.options.getInteger("kwota");

            if (!user || !kwota || kwota <= 0) {
                return interaction.reply({
                    content: "❌ Podaj poprawnego użytkownika i dodatnią kwotę.",
                    ephemeral: true
                });
            }

            const account = getUserAccount(user.id);
            if (!account) {
                return interaction.reply({
                    content: "❌ Ten użytkownik nie ma konta bankowego.",
                    ephemeral: true
                });
            }

            const data = loadBankData();
            data[user.id].balance += kwota;
            saveBankData(data);

            return interaction.reply({
                content: `✅ Dodano ${kwota} $ do konta ${user}.\nNowe saldo: ${data[user.id].balance} $`,
                ephemeral: true
            });
        }
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
        .setDescription(`Witaj ${member.user}, cieszymy się, że dołączyłeś do naszej społeczności!`)
        .setThumbnail(member.user.displayAvatarURL());

    await channel.send({ embeds: [embed] });
});
// ============================
// AUTO-KANAŁY GŁOSOWE (TEMP VOICE)
// ============================

const tempVoice = new Map(); // userId -> { channelId, banned: Set() }

client.on("voiceStateUpdate", async (oldState, newState) => {
    const guild = newState.guild;
    const member = newState.member;

    // Wejście na kanał "stwórz kanał"
    if (newState.channelId === CREATE_VOICE_CHANNEL_ID) {

        // Jeśli już ma kanał – nic nie rób
        if (tempVoice.has(member.id)) return;

        const baseChannel = newState.channel;

        const channel = await guild.channels.create({
            name: `kanał-${member.user.username}`,
            type: 2,
            parent: baseChannel?.parentId ?? null,
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

    // Wyjście z kanału – auto delete
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

// ============================
// PRZYCISKI PANELU TEMP VOICE
// ============================

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("pv_")) return; // nie rusza Twoich przycisków

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

// ============================
// SELECT MENU — KICK / BAN
// ============================

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

// ============================
// LIMIT — MODAL
// ============================

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
// START
// ============================
client.login(process.env.TOKEN);
