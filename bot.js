const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    InteractionType, StringSelectMenuBuilder,
    Partials, REST, Routes, SlashCommandBuilder
} = require("discord.js");
const fs = require("fs");

// ============================
// 🔹 KONFIGURACJA BOTA / SERWERA
// ============================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
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

// EKONOMIA — KANAŁY
const BANK_CHANNEL_ID = "1479903334751015065";
const KANTOR_CHANNEL_ID = "1479872519799574729";
const SKLEP_CHANNEL_ID = "1479872602930675923";
const PRACUJ_CHANNEL_ID = "1479872708928864388"; // kanał pracy + embed /pracuj

// ROLE SKLEPU
const PREMIUM_ROLE_ID = "1479920896759173377";
const PJ_B_ROLE_ID = "1479920137749401752";
const PJ_A_ROLE_ID = "1479920273225678918";
const PJ_T_ROLE_ID = "1479920305743986951";
const PJ_C_ROLE_ID = "1479920339248091146";
const PJ_D_ROLE_ID = "1479920368360755415";
const PJ_CE_ROLE_ID = "1479920394831003892";

// COOLDOWN PRACY (1 godzina dla /pracuj)
const workCooldown = new Map(); // userId → timestamp

// ============================
// 🔹 DOWODY — NUMERACJA I LISTA
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
// 🔹 EKONOMIA — BANK (TXT)
// ============================
const BANK_FILE = "bank.txt"; // format: userId|pin|balance
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
// 🔹 AUTOMATYCZNA REJESTRACJA KOMEND
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
// 🔹 READY
// ============================
client.once("ready", async () => {
    console.log(`Bot działa jako ${client.user.tag}`);

    // Rejestracja komend
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

    // WERYFIKACJA
    const verifyChannel = guild.channels.cache.get(VERIFY_CHANNEL_ID);
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
    const urzadChannel = guild.channels.cache.get(URZAD_PANEL_CHANNEL_ID);
    if (urzadChannel) {
        const embedUrzad = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:mod:1479847501149372467> Urząd Miejski   
Witaj w oficjalnym panelu Urzędu Miejskiego.

Poniżej znajdziesz trzy główne sekcje, które pozwolą Ci szybko i wygodnie załatwić najważniejsze sprawy urzędowe na naszym serwerze. Każda z dostępnych opcji prowadzi do osobnego procesu obsługi, dzięki czemu Twoje zgłoszenie trafi dokładnie tam, gdzie powinno.

• Dowód osobisty
Wybierz tę opcję, jeśli chcesz złożyć wniosek o wydanie dowodu osobistego. Zostaniesz poproszony o podanie podstawowych danych, takich jak imię, nazwisko, płeć oraz obywatelstwo. Po wypełnieniu formularza Twój wniosek zostanie automatycznie przesłany do odpowiedniego działu.

• Prawo jazdy
Ta sekcja umożliwia złożenie wniosku o prawo jazdy w wybranej kategorii.
Wymagane jest wcześniejsze zakupienie odpowiedniego prawa jazdy w sklepie serwera.
Po wybraniu kategorii zostanie utworzony specjalny kanał, w którym dokończysz proces składania wniosku.

• Zapytanie do urzędu
Jeśli masz pytanie, wątpliwość lub chcesz zgłosić sprawę wymagającą indywidualnego rozpatrzenia, wybierz tę opcję. Otworzy się kanał, w którym będziesz mógł opisać swój problem, a administracja udzieli Ci odpowiedzi.`);

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

    // BANK
    const bankChannel = guild.channels.cache.get(BANK_CHANNEL_ID);
    if (bankChannel) {
        const embedBank = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:mlot:1479760749541855362> Bank 

Witamy w oficjalnym systemie bankowym serwera.  
Bank Centralny zapewnia bezpieczne przechowywanie środków oraz szybkie i wygodne operacje finansowe dla wszystkich mieszkańców miasta.

## - Dostępne usługi:
• **Sprawdzenie salda** – natychmiastowy podgląd aktualnego stanu Twojego konta.  
• **Przelewy między graczami** – szybkie i bezpieczne przesyłanie środków innym mieszkańcom.  

## - Logowanie i bezpieczeństwo
Aby uzyskać dostęp do swojego konta, kliknij przycisk **Zaloguj się** poniżej.  
Jeśli korzystasz z banku po raz pierwszy, zostaniesz poproszony o utworzenie **4‑cyfrowego PIN-u**, który będzie służył jako zabezpieczenie Twojego konta.

PIN jest znany wyłącznie Tobie — nie udostępniaj go innym graczom ani członkom administracji.  

## - Informacje dodatkowe
• Każdy gracz może posiadać tylko jedno konto bankowe.  
• Przelewy są realizowane natychmiastowo.  

Dziękujemy za korzystanie z usług Banku.  
Twoje bezpieczeństwo i wygoda są naszym priorytetem.`);

        const rowBank = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("bank_login")
                .setLabel("Zaloguj się")
                .setStyle(ButtonStyle.Secondary)
        );

        await bankChannel.send({ embeds: [embedBank], components: [rowBank] });
    }

    // KANTOR
    const kantorChannel = guild.channels.cache.get(KANTOR_CHANNEL_ID);
    if (kantorChannel) {
        const embedKantor = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:rakieta:1479760849835917342> Kantor 

Witamy w oficjalnym Kantorze Miejskim, miejscu przeznaczonym do bezpiecznej i przejrzystej wymiany walut pomiędzy ekonomią gry a ekonomią serwera.

## - Informacje o kursie wymiany
Aktualny kurs walut został ustalony przez Bank Centralny i obowiązuje wszystkich mieszkańców miasta:

• **8000€ w grze → 4000$ na serwerze**

## - Jak działa wymiana?
Proces wymiany waluty jest prosty i w pełni bezpieczny:

1. Kliknij przycisk **Wymień walutę**, aby otworzyć indywidualny ticket obsługi.
2. W ticketcie otrzymasz dalsze instrukcje dotyczące przebiegu transakcji.
3. Po potwierdzeniu wymiany środki zostaną dodane do Twojego konta na serwerze.

## - Zasady bezpieczeństwa
• Wymiana walut odbywa się wyłącznie poprzez oficjalny system kantoru.  
• Nie wykonuj transakcji poza ticketem — chroni to Twoje środki przed utratą.  

Dziękujemy za korzystanie z usług Kantoru.`);

        const rowKantor = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("kantor_wymiana")
                .setLabel("Wymień walutę")
                .setStyle(ButtonStyle.Secondary)
        );

        await kantorChannel.send({ embeds: [embedKantor], components: [rowKantor] });
    }

    // SKLEP
    const sklepChannel = guild.channels.cache.get(SKLEP_CHANNEL_ID);
    if (sklepChannel) {
        const embedSklep = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:sklep:1479916476210352239> Sklep 

Witamy w oficjalnym sklepie serwera.  
To miejsce, w którym możesz nabyć różnego rodzaju uprawnienia, licencje oraz usługi dostępne dla mieszkańców miasta.

## - Jak działa sklep?
Po kliknięciu przycisku **Otwórz sklep** wyświetli Ci się lista dostępnych produktów.  
Każdy zakup jest realizowany automatycznie — środki zostaną pobrane z Twojego konta bankowego, a zakup zostanie natychmiast zapisany w systemie.

## - Zasady zakupów
• Aby dokonać zakupu, musisz posiadać wystarczającą ilość środków na koncie bankowym.  
• Wszystkie transakcje są ostateczne — upewnij się, że wybierasz właściwy produkt.  

Dziękujemy za korzystanie ze Sklepu.`);

        const rowSklep = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("sklep_open")
                .setLabel("Otwórz sklep")
                .setStyle(ButtonStyle.Secondary)
        );

        await sklepChannel.send({ embeds: [embedSklep], components: [rowSklep] });
    }
});

// ============================
// 🔹 KOMENDY TEKSTOWE (bez „pracuj”)
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

    // UWAGA: brak komendy tekstowej "pracuj" — jest tylko /pracuj
});

// ============================
// 🔹 INTERAKCJE
// ============================
client.on("interactionCreate", async (interaction) => {

    // ---------- PRZYCISKI ----------
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

        // REGULAMINY — OTWARCIE MENU
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

        // DOWÓD — MODAL
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

        // PRAWO JAZDY — PANEL
        if (interaction.customId === "pj_start") {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("<:koperta:1479760548500471830> Wniosek o prawo jazdy")
                .setDescription(
`Poniżej wybierz kategorię prawa jazdy, o którą chcesz złożyć wniosek.

- **Wymagane jest wcześniejsze zakupienie odpowiedniego prawa jazdy w sklepie serwera.**  
- Po wybraniu kategorii zostanie utworzony specjalny ticket, w którym zostanie przeprowadzona dalsza procedura.`);

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

        // PYTANIE DO URZĘDU — TICKET
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
`# <:mlot:1479760749541855362> Pytanie do administracji

Witaj w oficjalnym ticketcie Urzędu Miejskiego.  
To miejsce służy do zgłaszania wszelkich pytań, problemów oraz spraw wymagających interwencji administracji.

## - Jak korzystać z ticketu?
W tym ticketcie możesz opisać:
• swój problem,  
• pytanie dotyczące zasad lub działania serwera,  
• zgłoszenie dotyczące innego gracza,  
• prośbę o pomoc w sprawach technicznych lub organizacyjnych.

Postaraj się przedstawić sytuację możliwie dokładnie — ułatwi to szybsze i skuteczniejsze rozwiązanie Twojej sprawy.

## - Zasady obowiązujące w ticketcie
• Zachowaj kulturę wypowiedzi.  
• Nie spamuj wiadomościami — każda sprawa zostanie zauważona.  

Dziękujemy za kontakt z Urzędem.`);

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
                interaction.user.id !== interaction.guild.ownerId &&
                !interaction.member.roles.cache.has(EGZAMINATOR_ROLE_ID)
            ) {
                return interaction.reply({
                    content: "❌ Nie masz uprawnień.",
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
                content: `✔️ Zgłoszenie zostało przyjęte przez ${interaction.user}.`,
                ephemeral: false
            });
        }

        // ZAMYKANIE TICKETA
        if (interaction.customId === "ticket_close") {
            if (
                interaction.user.id !== interaction.guild.ownerId &&
                !interaction.member.roles.cache.has(EGZAMINATOR_ROLE_ID)
            ) {
                return interaction.reply({
                    content: "❌ Tylko egzaminator lub właściciel serwera może zamykać tickety.",
                    ephemeral: true
                });
            }

            return interaction.channel.delete();
        }

        // BANK — LOGOWANIE / TWORZENIE KONTA
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

        // BANK — MENU
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

        // BANK — SALDO
        if (interaction.customId === "bank_saldo") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany do banku.",
                    ephemeral: true
                });
            }

            const account = getUserAccount(interaction.user.id);
            if (!account) {
                return interaction.reply({
                    content: "❌ Nie masz konta bankowego.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: `💰 Twoje saldo: **${account.balance} $**`,
                ephemeral: true
            });
        }

        // BANK — PRZELEW (MODAL)
        if (interaction.customId === "bank_przelew") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany do banku.",
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("bank_transfer_modal")
                .setTitle("Przelew bankowy");

            const targetInput = new TextInputBuilder()
                .setCustomId("bank_transfer_target")
                .setLabel("Podaj @użytkownika lub jego ID")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const amountInput = new TextInputBuilder()
                .setCustomId("bank_transfer_amount")
                .setLabel("Kwota przelewu")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(targetInput),
                new ActionRowBuilder().addComponents(amountInput)
            );

            return interaction.showModal(modal);
        }

        // KANTOR — TICKET
        if (interaction.customId === "kantor_wymiana") {
            const parent = interaction.channel.parentId || URZAD_CATEGORY_ID;

            const ticket = await interaction.guild.channels.create({
                name: `kantor-${interaction.user.username}`,
                type: 0,
                parent: parent,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:konfetti:1479760987790770288> Kantor — wymiana waluty

Aby wymienić walutę:
1. Postępuj zgodnie z instrukcjami podanymi przez administrację w tym ticketcie.
2. Po potwierdzeniu transakcji środki zostaną dodane do Twojego konta na serwerze.`);

            await ticket.send({ content: `${interaction.user}`, embeds: [embed] });

            return interaction.reply({
                content: "Ticket kantoru został utworzony!",
                ephemeral: true
            });
        }

        // SKLEP — OTWARCIE MENU
        if (interaction.customId === "sklep_open") {
            const menu = new StringSelectMenuBuilder()
                .setCustomId("sklep_select")
                .setPlaceholder("Wybierz, co chcesz kupić")
                .addOptions(
                    { label: "Ranga Premium (8000$)", value: "premium_8000" },
                    { label: "Prawo jazdy B (3500$)", value: "pj_B_3500" },
                    { label: "Prawo jazdy A (3000$)", value: "pj_A_3000" },
                    { label: "Prawo jazdy T (2000$)", value: "pj_T_2000" },
                    { label: "Prawo jazdy C (4000$)", value: "pj_C_4000" },
                    { label: "Prawo jazdy D (4500$)", value: "pj_D_4500" },
                    { label: "Prawo jazdy C+E (5000$)", value: "pj_CE_5000" }
                );

            return interaction.reply({
                content: "Wybierz przedmiot do zakupu:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }
    }

    // ---------- MODALE ----------
    if (interaction.type === InteractionType.ModalSubmit) {

        // WERYFIKACJA
        if (interaction.customId === "verification_modal") {
            const nick = interaction.fields.getTextInputValue("roblox_nick");
            const adminChannel = interaction.guild.channels.cache.get(ADMIN_CHANNEL_ID);

            if (adminChannel) {
                await adminChannel.send(
`<:osoba:1479761131206611078> **Nowa weryfikacja**
Użytkownik: ${interaction.user.tag}
Nick Roblox: ${nick}`
                );
            }

            return interaction.reply({
                content: "Twój nick został wysłany do weryfikacji <:ptaszek:1479761065850962020>",
                ephemeral: true
            });
        }

        // DOWÓD — tylko raz
        if (interaction.customId === "dowod_modal") {
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

            const dowodyChannel = interaction.guild.channels.cache.get(DOWODY_CHANNEL_ID);

            dowodCounter++;
            saveDowodCounter();
            usersWithID.add(interaction.user.id);
            saveUserID(interaction.user.id);

            if (dowodyChannel) {
                const embedData = new EmbedBuilder()
                    .setColor("Orange")
                    .setDescription(
`# 📄 Nowy dowód osobisty  
**Użytkownik:** ${interaction.user}

**Imię:** ${imie}
**Nazwisko:** ${nazwisko}
**Płeć:** ${plec}
**Obywatelstwo:** ${obywatelstwo}

**Numer dowodu:** ${dowodCounter}`);

                await dowodyChannel.send({ embeds: [embedData] });
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
                content: `✅ Przelano **${amount} $** do <@${targetId}>.`,
                ephemeral: true
            });
        }
    }

    // ---------- SELECT MENU ----------
    if (interaction.isStringSelectMenu()) {

        // REGULAMINY
        if (interaction.customId === "wybor_regulaminu") {
            const value = interaction.values[0];

            if (value === "discord") {
                return interaction.reply({
                    content:
`# <:koperta:1479760548500471830> Regulamin Discord

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

            if (value === "roblox") {
                return interaction.reply({
                    content:
`# <:pad:1479760675533492224> Regulamin Roblox 

1. FRP – odgrywanie nielogiczne  
2. RDM – zabijanie bez powodu  
3. VDM – zabijanie pojazdami  
4. Power Gaming  
5. Meta Gaming  
6. Cheaty / Exploity  
7. Podszywanie się pod administrację  
8. Reklama / linki phishingowe`,
                    ephemeral: true
                });
            }

            if (value === "taryfikator_discord") {
                return interaction.reply({
                    content:
`# <:mlot:1479760749541855362> Taryfikator Discord

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
`# <:mlot:1479760749541855362> Taryfikator Roblox

1. FRP – 1 dzień bana  
2. RDM – 1–3 dni bana  
3. VDM – 1–3 dni bana  
4. Power Gaming – 3 dni bana  
5. Meta Gaming – 3 dni bana  
6. Cheaty / Exploity – PERMANENTNY BAN  
7. Podszywanie się pod administrację – 7 dni bana  
8. Reklama / linki phishingowe – PERMANENTNY BAN`,
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
Twój wniosek został pomyślnie zarejestrowany w systemie Urzędu Miejskiego.

Na tym etapie nie musisz podawać żadnych dodatkowych danych.  
Prosimy jedynie o cierpliwość — **egzaminator skontaktuje się z Tobą w ciągu 24 godzin**, aby przekazać dalsze instrukcje dotyczące procesu egzaminacyjnego.

Aby usprawnić procedurę, prosimy o podanie w tym ticketcie **dogodnej dla Ciebie godziny**, w której egzaminator może się z Tobą skontaktować.`);

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

        // SKLEP — ZAKUP + NADAWANIE RÓL
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
                    content: `❌ Nie masz wystarczających środków. Potrzebujesz **${price} $**.`,
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
                content: `✅ Zakupiono: **${name}** za **${price} $**.\n🎉 Otrzymałeś rolę: **${role?.name || "Nie znaleziono roli"}**`,
                ephemeral: true
            });
        }
    }

    // ---------- SLASH KOMENDY ----------
    if (interaction.isChatInputCommand()) {

        // /pracuj — publiczny embed na kanale PRACUJ_CHANNEL_ID + cooldown 1 godzina
        if (interaction.commandName === "pracuj") {

            const account = getUserAccount(interaction.user.id);
            if (!account) {
                return interaction.reply({
                    content: "❌ Nie masz konta bankowego. Najpierw zaloguj się w kanale bank.",
                    ephemeral: true
                });
            }

            // COOLDOWN 1 GODZINA
            const lastWork = workCooldown.get(interaction.user.id);
            const now = Date.now();
            const hour = 60 * 60 * 1000;

            if (lastWork && now - lastWork < hour) {
                const remaining = hour - (now - lastWork);
                const minutes = Math.ceil(remaining / 60000);

                return interaction.reply({
                    content: `⏳ Możesz ponownie pracować za **${minutes} minut**.`,
                    ephemeral: true
                });
            }

            // zapis cooldownu
            workCooldown.set(interaction.user.id, now);

            // losowanie zarobku
            const amount = Math.floor(Math.random() * (400 - 30 + 1)) + 30;

            // zapis do banku
            const data = loadBankData();
            data[interaction.user.id].balance += amount;
            saveBankData(data);

            // embed publiczny na kanale PRACUJ_CHANNEL_ID
            const guild = interaction.guild;
            const workChannel = guild.channels.cache.get(PRACUJ_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("🛠️ Praca wykonana!")
                .setDescription(
                    `**${interaction.user} wykonał pracę!**  

💵 Otrzymał: **${amount} $**  
💰 Nowe saldo: **${data[interaction.user.id].balance} $**`
                )
                .setThumbnail(interaction.user.displayAvatarURL());

            if (workChannel) {
                await workChannel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: "✅ Twoja praca została zarejestrowana. Sprawdź kanał pracy, aby zobaczyć embed.",
                ephemeral: true
            });
        }

        // /dodajkase
        if (interaction.commandName === "dodajkase") {

            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: "❌ Tylko właściciel serwera może używać tej komendy.",
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
                content: `✅ Dodano **${kwota} $** do konta ${user}.  
Nowe saldo: **${data[user.id].balance} $**`,
                ephemeral: true
            });
        }
    }
});

// ============================
// 🔹 POWITANIE
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
// 🔹 START BOTA
// ============================
client.login(process.env.TOKEN);
