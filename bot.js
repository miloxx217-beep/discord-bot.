console.log("URUCHAMIAM TEN PLIK:", __filename);
require("dotenv").config();
const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    InteractionType, StringSelectMenuBuilder,
    Partials, REST, Routes, SlashCommandBuilder
} = require("discord.js");

const {
    hasDowod,
    createDowod,
    getUserAccount,
    createUserAccount,
    updateBalance
} = require("./db");

// ============================
// KONFIGURACJA
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

const BANK_CHANNEL_ID = "1479903334751015065";
const KANTOR_CHANNEL_ID = "1479872519799574729";
const SKLEP_CHANNEL_ID = "1479872602930675923";
const PRACUJ_CHANNEL_ID = "1479872708928864388";

// Kategoria, w której mają się pojawiać tickety kantoru
const KANTOR_TICKET_CATEGORY_ID = "1480134306495201300";

// Rola właściciel
const WLASCICIEL_ROLE_ID = "1478754923142316276";

const PREMIUM_ROLE_ID = "1479920896759173377";
const PJ_B_ROLE_ID = "1479920137749401752";
const PJ_A_ROLE_ID = "1479920273225678918";
const PJ_T_ROLE_ID = "1479920305743986951";
const PJ_C_ROLE_ID = "1479920339248091146";
const PJ_D_ROLE_ID = "1479920368360755415";
const PJ_CE_ROLE_ID = "1479920394831003892";

// cooldown /pracuj
const workCooldown = new Map();

// zalogowani do banku
const loggedInUsers = new Set();

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
// READY
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

# • Dowód osobisty
Wybierz tę opcję, jeśli chcesz złożyć wniosek o wydanie dowodu osobistego. Zostaniesz poproszony o podanie podstawowych danych, takich jak imię, nazwisko, płeć oraz obywatelstwo. Po wypełnieniu formularza Twój wniosek zostanie automatycznie przesłany do odpowiedniego działu.

# • Prawo jazdy
Ta sekcja umożliwia złożenie wniosku o prawo jazdy w wybranej kategorii.
Wymagane jest wcześniejsze zakupienie odpowiedniego prawa jazdy w sklepie serwera.
Po wybraniu kategorii zostanie utworzony specjalny kanał, w którym dokończysz proces składania wniosku.

# • Zapytanie do urzędu
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
Bank zapewnia bezpieczne przechowywanie środków oraz szybkie i wygodne operacje finansowe dla wszystkich mieszkańców miasta.

# - Dostępne usługi:
• Sprawdzenie salda – natychmiastowy podgląd aktualnego stanu Twojego konta.
• Przelewy między graczami – szybkie i bezpieczne przesyłanie środków innym graczom.

# - Logowanie i bezpieczeństwo
Aby uzyskać dostęp do swojego konta, kliknij przycisk Zaloguj się poniżej.
Jeśli korzystasz z banku po raz pierwszy, zostaniesz poproszony o utworzenie 4‑cyfrowego PIN-u, który będzie służył jako zabezpieczenie Twojego konta.

PIN jest znany wyłącznie Tobie — nie udostępniaj go innym graczom ani członkom administracji.

# - Informacje dodatkowe
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
`# <:rakieta:1479760849835917342> Kantor Wymiany Walut

Witamy w oficjalnym Kantorze, miejscu przeznaczonym do bezpiecznej i przejrzystej wymiany walut pomiędzy ekonomią gry a ekonomią serwera.

# • Informacje o kursie wymiany
Aktualny kurs walut został ustalony przez Bank i obowiązuje wszystkich graczy serwera:

**• 8000€ w grze → 4000$ na serwerze**

# • Jak działa wymiana?
Proces wymiany waluty jest prosty i w pełni bezpieczny:

Kliknij przycisk Wymień walutę, aby otworzyć indywidualny ticket obsługi.
W ticketcie otrzymasz dalsze instrukcje dotyczące przebiegu transakcji.
Po potwierdzeniu wymiany środki zostaną dodane do Twojego konta na serwerze.

# • Zasady bezpieczeństwa
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
To miejsce, w którym możesz nabyć różnego rodzaju uprawnienia, licencje oraz usługi dostępne dla graczy serwera.

# • Jak działa sklep?
Po kliknięciu przycisku Otwórz sklep wyświetli Ci się lista dostępnych produktów.
Każdy zakup jest realizowany automatycznie — środki zostaną pobrane z Twojego konta bankowego, a zakup zostanie natychmiast zapisany w systemie.

# • Zasady zakupów
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
// MESSAGE
// ============================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!regulamin") {
        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:koperta:1479760548500471830> Regulamin serwera

Witamy na naszym serwerze!

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

        // DOWÓD — sprawdzenie w SQLite
        if (interaction.customId === "dowod_start") {

            if (await hasDowod(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Masz już dowód osobisty.",
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
        }

        // PRAWO JAZDY
        if (interaction.customId === "pj_start") {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("<:koperta:1479760548500471830> Wniosek o prawo jazdy")
                .setDescription(
`Poniżej wybierz kategorię prawa jazdy, o którą chcesz złożyć wniosek.

- Wymagane jest wcześniejsze zakupienie odpowiedniego prawa jazdy w sklepie serwera.
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

Witaj w oficjalnym ticketcie Urzędu Miejskiego.
To miejsce służy do zgłaszania wszelkich pytań oraz problemów.

W tym ticketcie możesz opisać:
• swój problem,
• pytanie dotyczące zasad lub działania serwera,
• prośbę o pomoc w sprawach technicznych lub organizacyjnych.

Postaraj się przedstawić sytuację możliwie dokładnie — ułatwi to szybsze i skuteczniejsze rozwiązanie Twojej sprawy.

Zachowaj kulturę wypowiedzi i nie spamuj wiadomościami — każda sprawa zostanie zauważona.`);

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

        // BANK LOGIN (SQLite)
        if (interaction.customId === "bank_login") {
            const account = await getUserAccount(interaction.user.id);

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

        // BANK SALDO (SQLite)
        if (interaction.customId === "bank_saldo") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany do banku.",
                    ephemeral: true
                });
            }

            const account = await getUserAccount(interaction.user.id);
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

        // BANK PRZELEW MODAL (SQLite)
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

        // KANTOR — OTWARCIE TICKETA
        if (interaction.customId === "kantor_wymiana") {

            const ticket = await interaction.guild.channels.create({
                name: `kantor-${interaction.user.username}`,
                type: 0,
                parent: KANTOR_TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`<:rakieta:1479760849835917342> Kantor — wymiana waluty

Instrukcja wymiany waluty

1. Kurs wymiany:
1000€ w grze = 500$ na serwerze.
Wyślij dowolną ilość waluty w grze na nick: kaloszek77i

2. Zrób pełnoekranowy zrzut ekranu, który musi zawierać:
• potwierdzenie wysłania waluty,
• widoczną datę i godzinę,
• cały ekran (bez przycinania).

3. Wstaw zrzut ekranu do tego ticketu.

Po sprawdzeniu screena administracja przeliczy walutę według kursu i środki zostaną dodane do Twojego konta bankowego.`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("kantor_realizuj")
                    .setLabel("Zrealizuj kantor")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("kantor_zamknij")
                    .setLabel("Zamknij kantor")
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });

            return interaction.reply({
                content: "Ticket kantoru został utworzony!",
                ephemeral: true
            });
        }

        // KANTOR — REALIZACJA (SQLite)
        if (interaction.customId === "kantor_realizuj") {

            if (!interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("kantor_modal")
                .setTitle("Realizacja kantoru");

            const idInput = new TextInputBuilder()
                .setCustomId("kantor_id")
                .setLabel("ID użytkownika Discord")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const kwotaInput = new TextInputBuilder()
                .setCustomId("kantor_kwota")
                .setLabel("Kwota do wypłaty ($)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(idInput),
                new ActionRowBuilder().addComponents(kwotaInput)
            );

            return interaction.showModal(modal);
        }

        // KANTOR — ZAMKNIĘCIE
        if (interaction.customId === "kantor_zamknij") {

            if (!interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            return interaction.channel.delete();
        }

        // SKLEP — OTWARCIE
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
    // MODALE
    if (interaction.type === InteractionType.ModalSubmit) {

        // WERYFIKACJA
        if (interaction.customId === "verification_modal") {
            const nick = interaction.fields.getTextInputValue("roblox_nick");
            const adminChannel = interaction.guild.channels.cache.get(ADMIN_CHANNEL_ID);

            if (adminChannel) {
                await adminChannel.send(
`<:osoba:1479761131206611078> Nowa weryfikacja
Użytkownik: ${interaction.user.tag}
Nick Roblox: ${nick}`
                );
            }

            return interaction.reply({
                content: "Twój nick został wysłany do weryfikacji <:ptaszek:1479761065850962020>",
                ephemeral: true
            });
        }

        // DOWÓD — SQLite
        if (interaction.customId === "dowod_modal") {

            if (await hasDowod(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Masz już wyrobiony dowód osobisty.",
                    ephemeral: true
                });
            }

            const imie = interaction.fields.getTextInputValue("dowod_imie");
            const nazwisko = interaction.fields.getTextInputValue("dowod_nazwisko");
            const plec = interaction.fields.getTextInputValue("dowod_plec");
            const obywatelstwo = interaction.fields.getTextInputValue("dowod_obywatelstwo");

            const numer = Math.floor(Math.random() * 900000) + 100000;

            await createDowod(interaction.user.id, imie, nazwisko, plec, obywatelstwo, numer);

            const dowodyChannel = interaction.guild.channels.cache.get(DOWODY_CHANNEL_ID);

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

Numer dowodu: ${numer}`);

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

            const existing = await getUserAccount(interaction.user.id);
            if (existing) {
                return interaction.reply({
                    content: "❌ Masz już konto bankowe.",
                    ephemeral: true
                });
            }

            await createUserAccount(interaction.user.id, pin);
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
            const account = await getUserAccount(interaction.user.id);

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

            const senderAcc = await getUserAccount(interaction.user.id);
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

            const targetAcc = await getUserAccount(targetId);
            if (!targetAcc) {
                return interaction.reply({
                    content: "❌ Odbiorca nie ma konta bankowego.",
                    ephemeral: true
                });
            }

            await updateBalance(interaction.user.id, -amount);
            await updateBalance(targetId, amount);

            return interaction.reply({
                content: `✅ Przelano ${amount} $ do <@${targetId}>.`,
                ephemeral: true
            });
        }

        // KANTOR — REALIZACJA
        if (interaction.customId === "kantor_modal") {

            if (!interaction.member.roles.cache.has(WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            const userId = interaction.fields.getTextInputValue("kantor_id").trim();
            const kwotaRaw = interaction.fields.getTextInputValue("kantor_kwota").trim();
            const kwota = Number(kwotaRaw);

            if (isNaN(kwota) || kwota <= 0) {
                return interaction.reply({
                    content: "❌ Kwota musi być liczbą dodatnią.",
                    ephemeral: true
                });
            }

            const account = await getUserAccount(userId);
            if (!account) {
                return interaction.reply({
                    content: "❌ Ten użytkownik nie ma konta bankowego.",
                    ephemeral: true
                });
            }

            await updateBalance(userId, kwota);

            await interaction.channel.send(
                `Realizacja kantoru\nUżytkownik <@${userId}> otrzymał ${kwota}$.`
            );

            return interaction.reply({
                content: "✔ Kantor został zrealizowany.",
                ephemeral: true
            });
        }
    }

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {

        // REGULAMINY
        if (interaction.customId === "wybor_regulaminu") {
            const value = interaction.values[0];

            if (value === "discord") {
                return interaction.reply({
                    content:
`Regulamin Discord

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
`Regulamin Roblox

Zakazuje się:
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

Dziękujemy za złożenie wniosku o wydanie prawa jazdy.`);

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
                content: "Twój wniosek został zarejestrowany!",
                ephemeral: true
            });
        }
    }

    // SLASH KOMENDY
    if (interaction.isChatInputCommand()) {

        // /pracuj — SQLite
        if (interaction.commandName === "pracuj") {

            const account = await getUserAccount(interaction.user.id);
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

            await updateBalance(interaction.user.id, amount);
            const updated = await getUserAccount(interaction.user.id);

            const guild = interaction.guild;
            const workChannel = guild.channels.cache.get(PRACUJ_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("Praca wykonana")
                .setDescription(
                    `${interaction.user} wykonał pracę.\n\nOtrzymał: ${amount} $\nNowe saldo: ${updated.balance} $`
                )
                .setThumbnail(interaction.user.displayAvatarURL());

            if (workChannel) {
                await workChannel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: "✅ Twoja praca została zarejestrowana.",
                ephemeral: true
            });
        }

        // /dodajkase — SQLite
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

            const account = await getUserAccount(user.id);
            if (!account) {
                return interaction.reply({
                    content: "❌ Ten użytkownik nie ma konta bankowego.",
                    ephemeral: true
                });
            }

            await updateBalance(user.id, kwota);
            const updated = await getUserAccount(user.id);

            return interaction.reply({
                content: `✅ Dodano ${kwota} $ do konta ${user}.\nNowe saldo: ${updated.balance} $`,
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
        .setDescription(`Witaj ${member.user}, cieszymy się, że dołączyłeś do naszej społeczności!<:konfetti:1479760987790770288>
        Pamiętaj, aby przejść weryfikację i zapoznać się z regulaminem.`)
        .setThumbnail(member.user.displayAvatarURL());

    await channel.send({ embeds: [embed] });
});

// ============================
// START
// ============================
console.log("TOKEN:", process.env.TOKEN);
console.log("LENGTH:", process.env.TOKEN?.length);
client.login(process.env.TOKEN);
