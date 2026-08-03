// ============================
// PODSTAWOWA KONFIGURACJA
// ============================
const { 
    Client, 
    GatewayIntentBits, 
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ============================
// CONFIG — UZUPEŁNIJ POD SIEBIE
// ============================
const config = {
GUILD_ID: "1508542188156354570",

// AKTYWNOŚĆ
AKTYWNOSC_PANEL_CHANNEL_ID: "1533492797020180601",
AKTYWNOSC_LOG_CHANNEL_ID: "1524035226005798913",
AKTYWNOSC_ROLE_ID: "1533493552099885087",

// URZĄD MIEJSKI
URZAD_PANEL_CHANNEL_ID: "1533494099535986788",
DOWODY_CHANNEL_ID: "1533495515059191828",
DOWOD_ROLE_ID: "1533496529497624767",

// PRAWO JAZDY — NOWY SYSTEM
PRAWO_JAZDY_CHANNEL_ID: "1508835874987573349",
EGZAMINATOR_PANEL_CHANNEL_ID: "1533498941231071443",

// TICKETY
TICKET_PANEL_CHANNEL_ID: "1508546375258865838",
TICKET_CATEGORY_ID: "1523334081004306603",
TICKET_STAFF2_ROLE_ID: "1508893365310197821",
ZARZAD_GLOWNY2_ROLE_ID: "1533468410132828250",
PARTNERSTWO_STAFF2_ROLE_ID: "1525966918455005275"
};
// ============================
// START BOTA
// ============================
client.once("ready", () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// ============================
// POMOCNICZE — AKTYWNOŚĆ
// ============================
const fs = require("fs");
const AKTYWNOSC_DB_FILE = "./aktywnosc.json";

function loadAktywnosc() {
    if (!fs.existsSync(AKTYWNOSC_DB_FILE)) {
        fs.writeFileSync(AKTYWNOSC_DB_FILE, JSON.stringify({ activities: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(AKTYWNOSC_DB_FILE, "utf8"));
}

function saveAktywnosc(db) {
    fs.writeFileSync(AKTYWNOSC_DB_FILE, JSON.stringify(db, null, 2));
}

// ============================
// INTERWAŁ — AKTUALIZACJA AKTYWNOŚCI
// ============================
setInterval(async () => {
    const db = loadAktywnosc();
    const activities = db.activities || {};

    for (const [msgId, data] of Object.entries(activities)) {
        if (data.done) continue;

        const guild = client.guilds.cache.get(config.GUILD_ID);
        if (!guild) continue;

        const channel = guild.channels.cache.get(data.channelId);
        if (!channel) continue;

        let msg;
        try {
            msg = await channel.messages.fetch(msgId);
        } catch {
            delete activities[msgId];
            saveAktywnosc(db);
            continue;
        }

        const reaction = msg.reactions.cache.get(data.emoji);
        const count = reaction ? reaction.count - 1 : 0;

        const embed = new EmbedBuilder()
            .setColor(0x90EE90)
            .setDescription(
`# 📊 Aktywność — PROJECT NLEX

**Dzisiejszy cel reakcji:** ${data.goal}
**Kod do EH:** ${data.kod}
**Emoji:** ${data.emoji}`
            )
            .setTimestamp();

        await msg.edit({
            content: `<@&${config.AKTYWNOSC_ROLE_ID}>`,
            embeds: [embed]
        });

        if (count >= data.goal) {
            data.done = true;
            saveAktywnosc(db);

            await channel.send({
                content: `✅ Aktywność zakończona — cel osiągnięty!`
            });
        }
    }

}, 10 * 1000);

// ============================
// POMOCNICZE — DOWODY
// ============================
async function generateNextDowodNumber(channel) {
    const messages = await channel.messages.fetch({ limit: 100 });

    let highest = 0;

    messages.forEach(msg => {
        if (!msg.embeds.length) return;

        const desc = msg.embeds[0].description;
        const match = desc.match(/\*\*Numer dowodu:\*\*\s*(\d+)/);

        if (match) {
            const num = parseInt(match[1]);
            if (num > highest) highest = num;
        }
    });

    return highest + 1;
}

// ============================
// POMOCNICZE — PRAWO JAZDY
// ============================
async function generateNextPrawoJazdyNumber(channel) {
    const messages = await channel.messages.fetch({ limit: 100 });

    let highest = 0;

    messages.forEach(msg => {
        if (!msg.embeds.length) return;

        const desc = msg.embeds[0].description;
        const match = desc.match(/\*\*Numer prawa jazdy:\*\*\s*(\d+)/);

        if (match) {
            const num = parseInt(match[1]);
            if (num > highest) highest = num;
        }
    });

    return highest + 1;
}

// ============================
// READY — PANELE
// ============================
client.on("ready", async () => {
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (!guild) return;


    // PANEL AKTYWNOŚCI
    const aktywnoscChannel = guild.channels.cache.get(config.AKTYWNOSC_PANEL_CHANNEL_ID);
    if (aktywnoscChannel) {
        const embed = new EmbedBuilder()
            .setColor(0x90EE90)
            .setTitle("📊 Panel aktywności — PROJECT NLEX")
            .setDescription(
`Kliknij przycisk poniżej, aby utworzyć nową aktywność:

- Cel reakcji
- Kod do EH
- Emoji reakcji`
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("aktywnosc_start")
                    .setLabel("Utwórz aktywność")
                    .setStyle(ButtonStyle.Secondary)
            );

        await aktywnoscChannel.send({ embeds: [embed], components: [row] });

    }

    // PANEL URZĘDU
    const urzadChannel = guild.channels.cache.get(config.URZAD_PANEL_CHANNEL_ID);
    if (urzadChannel) {
        const embed = new EmbedBuilder()
            .setColor(0x90EE90)
            .setDescription(
`# 🏛 Urząd Miejski — PROJECT NLEX

Witaj w **Urzędzie Miejskim PROJECT NLEX**!

W tym panelu możesz złożyć oficjalne wnioski dotyczące dokumentów tożsamości oraz uprawnień komunikacyjnych. Każda sprawa jest obsługiwana przez wykwalifikowanych pracowników urzędu, a proces przebiega w pełni automatycznie i zgodnie z zasadami systemu NLEX.

### 📘 Dostępne wnioski:

**1. Dowód osobisty**  
Wniosek o wydanie nowego dowodu osobistego. Dokument zawiera pełne dane obywatelskie, takie jak imię, nazwisko, płeć oraz obywatelstwo. Po złożeniu wniosku urząd wygeneruje Twój dowód i nada odpowiednią rolę potwierdzającą posiadanie dokumentu.

**2. Prawo jazdy (ticket egzaminacyjny)**  
Wniosek o rozpoczęcie procedury uzyskania prawa jazdy. System automatycznie utworzy ticket egzaminacyjny, w którym umówisz się z egzaminatorem na egzamin praktyczny. Po jego zdaniu egzaminator wystawi Ci oficjalne prawo jazdy wraz z unikalnym numerem dokumentu.

### ℹ️ Informacje dodatkowe:
- Każdy wniosek jest rejestrowany w systemie urzędowym.  
- Dokumenty są generowane automatycznie i wysyłane na odpowiednie kanały logów.  
- W przypadku prawa jazdy wymagany jest kontakt z egzaminatorem w ticketcie egzaminacyjnym.

Wybierz jedną z opcji poniżej, aby rozpocząć procedurę.`
            )
            .setTimestamp();


        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("urzad_dowod")
                    .setLabel("Dowód osobisty")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("urzad_prawo_jazdy")
                    .setLabel("Prawo jazdy")
                    .setStyle(ButtonStyle.Secondary)
            );

        await urzadChannel.send({ embeds: [embed], components: [row] });
    }


    // PANEL EGZAMINATORA
    const egzPanel = guild.channels.cache.get(config.EGZAMINATOR_PANEL_CHANNEL_ID);
    if (egzPanel) {
        const embed = new EmbedBuilder()
            .setColor(0x90EE90)
            .setDescription(
`# 🚗 Panel egzaminatora — PROJECT NLEX

Panel egzaminatora służy do oficjalnego wystawiania dokumentów prawa jazdy po pozytywnym zakończeniu egzaminu praktycznego.  
Każdy egzamin jest rejestrowany w systemie PROJECT NLEX, a dane wprowadzone przez egzaminatora trafiają bezpośrednio do urzędowego rejestru dokumentów.

### 📘 Informacje dla egzaminatora:
- Wystawiasz prawo jazdy **wyłącznie po zdanym egzaminie**.  
- W formularzu należy podać pełne dane kandydata: imię, nazwisko, obywatelstwo oraz kategorię uprawnień.  
- System automatycznie nadaje kolejny numer prawa jazdy i wysyła dokument na odpowiedni kanał logów.  
- Wszelkie błędne dane należy poprawić przed zatwierdzeniem — po wysłaniu dokumentu nie można go edytować.

### ℹ️ Dodatkowe informacje:
- Ticket egzaminacyjny jest tworzony przez gracza w panelu urzędu.  
- Egzaminator powinien potwierdzić zdanie egzaminu w ticketcie przed wystawieniem dokumentu.  
- Wystawione prawo jazdy jest traktowane jako oficjalny dokument w systemie NLEX.

Kliknij przycisk poniżej, aby przejść do formularza wystawiania prawa jazdy.`)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("egz_wystaw_pj")
                    .setLabel("Wystaw prawo jazdy")
                    .setStyle(ButtonStyle.Secondary)
            );

        await egzPanel.send({ embeds: [embed], components: [row] });
    }

    // PANEL TICKETÓW
    const ticketChannel = guild.channels.cache.get(config.TICKET_PANEL_CHANNEL_ID);
    if (ticketChannel) {
        const embed = new EmbedBuilder()
            .setColor(0x90EE90)
            .setDescription(
`# 🎫 System ticketów — PROJECT NLEX

Witaj w **Panelu Zgłoszeń PROJECT NLEX**!

W tym miejscu możesz zgłosić różne sprawy wymagające interwencji administracji, zarządu lub odpowiednich działów serwera. Każdy ticket jest automatycznie rejestrowany w systemie i trafia do właściwego zespołu, który zajmie się Twoją sprawą tak szybko, jak to możliwe.

### 📘 Dostępne typy zgłoszeń:

**1. Partnerstwo**  
Wybierz tę opcję, jeśli chcesz nawiązać współpracę z serwerem PROJECT NLEX. Podaj szczegóły projektu, linki oraz powód partnerstwa.

**2. Zgłoszenia**  
Służy do zgłaszania naruszeń regulaminu, nieodpowiednich zachowań, oszustw lub innych sytuacji wymagających reakcji administracji. Dołącz dowody, jeśli to możliwe.

**3. Odbiór nagrody**  
Jeśli wygrałeś konkurs, event lub otrzymałeś nagrodę od administracji — wybierz tę opcję, aby odebrać ją w ticketcie.

**4. Inne**  
Opcja dla spraw, które nie pasują do żadnej kategorii. Opisz dokładnie, czego dotyczy Twoje zgłoszenie.

**5. Sprawa do zarządu serwera**  
Wybierz tę kategorię, jeśli Twoja sprawa wymaga interwencji zarządu głównego. Dotyczy to poważniejszych tematów, konfliktów lub decyzji administracyjnych wyższego szczebla.

**6. Odwołanie od bana**  
Jeśli uważasz, że ban został nadany niesłusznie lub chcesz poprosić o drugą szansę — wybierz tę opcję i przedstaw swoją sytuację wraz z argumentami.

### ℹ️ Informacje dodatkowe:
- Każdy ticket jest obsługiwany przez odpowiedni dział.  
- W zależności od wybranej kategorii ticket może być kierowany do innej grupy administracyjnej.  
- Staraj się opisać sprawę jak najdokładniej, aby przyspieszyć proces rozpatrywania.

Wybierz typ zgłoszenia z listy poniżej, aby rozpocząć procedurę.`

            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("ticket_select")
                    .setPlaceholder("Wybierz typ zgłoszenia...")
                    .addOptions(
                        { label: "Partnerstwo", value: "partnerstwo" },
                        { label: "Zgłoszenia", value: "zgloszenia" },
                        { label: "Odbiór nagrody", value: "nagroda" },
                        { label: "Inne", value: "inne" },
                        { label: "Sprawa do zarządu serwera", value: "zarzad" },
                        { label: "Odwołanie od bana", value: "odwolanie_ban" }
                    )
            );

        await ticketChannel.send({ embeds: [embed], components: [row] });
    }
});

// ============================
// INTERAKCJE — BUTTONY / MODALE / SELECTY
// ============================
client.on("interactionCreate", async (interaction) => {
    try {

        // ============================
        // AKTYWNOŚĆ — BUTTON → MODAL
        // ============================
        if (interaction.isButton()) {

            if (interaction.customId === "aktywnosc_start") {

                const modal = new ModalBuilder()
                    .setCustomId("aktywnosc_modal")
                    .setTitle("Nowa aktywność — PROJECT NLEX");

                const cel = new TextInputBuilder()
                    .setCustomId("cel")
                    .setLabel("Cel reakcji (liczba)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const kod = new TextInputBuilder()
                    .setCustomId("kod")
                    .setLabel("Kod do EH")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const emoji = new TextInputBuilder()
                    .setCustomId("emoji")
                    .setLabel("Emoji reakcji (np. 🎯)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(cel),
                    new ActionRowBuilder().addComponents(kod),
                    new ActionRowBuilder().addComponents(emoji)
                );

                return interaction.showModal(modal);
            }

            // ============================
            // URZĄD — DOWÓD
            // ============================
            if (interaction.customId === "urzad_dowod") {
                const modal = new ModalBuilder()
                    .setCustomId("urzad_dowod_modal")
                    .setTitle("Wniosek o dowód osobisty — PROJECT NLEX");

                const imie = new TextInputBuilder()
                    .setCustomId("d_imie")
                    .setLabel("Imię")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const nazwisko = new TextInputBuilder()
                    .setCustomId("d_nazwisko")
                    .setLabel("Nazwisko")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const plec = new TextInputBuilder()
                    .setCustomId("d_plec")
                    .setLabel("Płeć")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const obywatelstwo = new TextInputBuilder()
                    .setCustomId("d_obywatelstwo")
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

            // ============================
            // URZĄD — PRAWO JAZDY → TICKET EGZAMINACYJNY
            // ============================
            if (interaction.customId === "urzad_prawo_jazdy") {

                const ticket = await interaction.guild.channels.create({
                    name: `egzamin-${interaction.user.username}`,
                    type: 0,
                    parent: config.TICKET_CATEGORY_ID,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: ["ViewChannel"] },
                        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
                        { id: config.TICKET_STAFF2_ROLE_ID, allow: ["ViewChannel", "SendMessages"] }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setColor(0x90EE90)
                    .setTitle("🚗 Ticket egzaminacyjny — PROJECT NLEX")
                    .setDescription(
`Witaj ${interaction.user}!

Tutaj umawiasz się z egzaminatorem na egzamin prawa jazdy.

Po zdanym egzaminie egzaminator wystawi Ci prawo jazdy.`)
                    .setTimestamp();

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("ticket_accept")
                        .setLabel("Przyjmij zgłoszenie")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId("ticket_close")
                        .setLabel("Zamknij ticket")
                        .setStyle(ButtonStyle.Danger)
                );

                await ticket.send({
                    content: `<@&${config.TICKET_STAFF2_ROLE_ID}>`,
                    embeds: [embed],
                    components: [buttons]
                });


                return interaction.reply({
                    content: `✔ Utworzono ticket egzaminacyjny: ${ticket}`,
                    ephemeral: true
                });
            }

            // ============================
            // OBSŁUGA PRZYCISKÓW TICKETÓW
            // ============================
            if (interaction.isButton()) {

                const staffRole = config.TICKET_STAFF2_ROLE_ID;
                const isStaff = interaction.member.roles.cache.has(staffRole);

                if (!isStaff) {
                    return interaction.reply({
                        content: "❌ Nie masz uprawnień do obsługi tego ticketu.",
                        ephemeral: true
                    });
                }

                // PRZYJĘCIE
                if (interaction.customId === "ticket_accept") {

                    await interaction.deferUpdate().catch(() => {});
                    await interaction.channel.send(
                        `✔ Zgłoszenie zostało przyjęte przez ${interaction.user}.`
                    );
                    return;
                }

                // ZAMKNIĘCIE
                if (interaction.customId === "ticket_close") {

                    await interaction.deferUpdate().catch(() => {});
                    await interaction.channel.send("🔒 Ticket zostanie zamknięty za 3 sekundy.");

                    setTimeout(() => {
                        interaction.channel.delete().catch(() => {});
                    }, 3000);

                    return;
                }
            }


            // ============================
            // PANEL EGZAMINATORA → MODAL
            // ============================
            if (interaction.customId === "egz_wystaw_pj") {

                const modal = new ModalBuilder()
                    .setCustomId("egz_pj_modal")
                    .setTitle("Wystaw prawo jazdy — PROJECT NLEX");

                const userId = new TextInputBuilder()
                    .setCustomId("pj_user")
                    .setLabel("ID użytkownika")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const imie = new TextInputBuilder()
                    .setCustomId("pj_imie")
                    .setLabel("Imię")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const nazwisko = new TextInputBuilder()
                    .setCustomId("pj_nazwisko")
                    .setLabel("Nazwisko")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const obywatelstwo = new TextInputBuilder()
                    .setCustomId("pj_obywatelstwo")
                    .setLabel("Obywatelstwo")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const kategoria = new TextInputBuilder()
                    .setCustomId("pj_kategoria")
                    .setLabel("Kategoria (A/B/C)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(userId),
                    new ActionRowBuilder().addComponents(imie),
                    new ActionRowBuilder().addComponents(nazwisko),
                    new ActionRowBuilder().addComponents(obywatelstwo),
                    new ActionRowBuilder().addComponents(kategoria)
                );

                return interaction.showModal(modal);
            }
        }

        // ============================
        // AKTYWNOŚĆ — MODAL → WYSYŁKA
        // ============================
        if (interaction.isModalSubmit() && interaction.customId === "aktywnosc_modal") {

            const cel = parseInt(interaction.fields.getTextInputValue("cel"));
            const kod = interaction.fields.getTextInputValue("kod");
            const emoji = interaction.fields.getTextInputValue("emoji");

            if (isNaN(cel) || cel <= 0)
                return interaction.reply({ content: "❌ Cel musi być liczbą.", ephemeral: true });

            const logChannel = interaction.guild.channels.cache.get(config.AKTYWNOSC_LOG_CHANNEL_ID);
            if (!logChannel)
                return interaction.reply({ content: "❌ Kanał aktywności nie istnieje.", ephemeral: true });

            const embed = new EmbedBuilder()
                .setColor(0x90EE90)
                .setDescription(
`# 📊 Aktywność — PROJECT NLEX

Dzisiejszy cel reakcji: ${cel}
Kod do EH: ${kod}
Emoji: ${emoji}`
                )
                .setTimestamp();

            const msg = await logChannel.send({
                content: `<@&${config.AKTYWNOSC_ROLE_ID}>`,
                embeds: [embed]
            });

            await msg.react(emoji);

            const db = loadAktywnosc();
            db.activities[msg.id] = { 
                goal: cel, 
                kod: kod, 
                done: false, 
                channelId: logChannel.id, 
                emoji: emoji 
            };
            saveAktywnosc(db);

            return interaction.reply({
                content: "✔ Aktywność utworzona.",
                ephemeral: true
            });
        }

        // ============================
        // URZĄD — MODAL DOWÓD
        // ============================
        if (interaction.isModalSubmit() && interaction.customId === "urzad_dowod_modal") {

            const imie = interaction.fields.getTextInputValue("d_imie");
            const nazwisko = interaction.fields.getTextInputValue("d_nazwisko");
            const plec = interaction.fields.getTextInputValue("d_plec");
            const obywatelstwo = interaction.fields.getTextInputValue("d_obywatelstwo");

            const kanal = interaction.guild.channels.cache.get(config.DOWODY_CHANNEL_ID);
            if (!kanal)
                return interaction.reply({ content: "❌ Kanał dowodów nie istnieje.", ephemeral: true });

            const numer = await generateNextDowodNumber(kanal);

            const embedDowod = new EmbedBuilder()
                .setColor(0x90EE90)
                .setDescription(`# 🪪 Nowy dowód osobisty — PROJECT NLEX

**Użytkownik:** ${interaction.user}

**Imię:** ${imie}
**Nazwisko:** ${nazwisko}
**Płeć:** ${plec}
**Obywatelstwo:** ${obywatelstwo}

**Numer dowodu:** ${numer}`)
                .setTimestamp();

            await kanal.send({ embeds: [embedDowod] });

            const rola = interaction.guild.roles.cache.get(config.DOWOD_ROLE_ID);
            if (rola) {
                await interaction.member.roles.add(rola).catch(() => {});
            }

            return interaction.reply({
                content: "✔ Twój dowód został wygenerowany!",
                ephemeral: true
            });
        }

        // ============================
        // EGZAMINATOR — MODAL PRAWO JAZDY
        // ============================
        if (interaction.isModalSubmit() && interaction.customId === "egz_pj_modal") {

            const userId = interaction.fields.getTextInputValue("pj_user");
            const imie = interaction.fields.getTextInputValue("pj_imie");
            const nazwisko = interaction.fields.getTextInputValue("pj_nazwisko");
            const obywatelstwo = interaction.fields.getTextInputValue("pj_obywatelstwo");
            const kategoria = interaction.fields.getTextInputValue("pj_kategoria");

            const kanal = interaction.guild.channels.cache.get(config.PRAWO_JAZDY_CHANNEL_ID);
            if (!kanal)
                return interaction.reply({ content: "❌ Kanał praw jazdy nie istnieje.", ephemeral: true });

            const numer = await generateNextPrawoJazdyNumber(kanal);

            const embedPJ = new EmbedBuilder()
                .setColor(0x90EE90)
                .setDescription(`# 🚗 Prawo jazdy — PROJECT NLEX

**Użytkownik:** <@${userId}>
**Imię:** ${imie}
**Nazwisko:** ${nazwisko}
**Obywatelstwo:** ${obywatelstwo}
**Kategoria:** ${kategoria}

**Numer prawa jazdy:** ${numer}`)
                .setTimestamp();
            
            await kanal.send({ embeds: [embedPJ] });

            return interaction.reply({
                content: "✔ Prawo jazdy zostało wystawione!",
                ephemeral: true
            });
        }

        // ============================
        // TICKETY — SELECT MENU
        // ============================
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "ticket_select") {

                const value = interaction.values[0];

                let reasonName = "";
                let pingRole = config.TICKET_STAFF2_ROLE_ID; // domyślnie pinguje staff
            
                reasonName = "Partnerstwo";
                 pingRole = config.PARTNERSTWO_STAFF2_ROLE_ID;

                reasonName = "inne";
                 pingRole = config.TICKET_STAFF2_ROLE_ID;

                

                switch (value) {
                    case "partnerstwo": reasonName = "Partnerstwo"; break;
                    case "zgloszenia": reasonName = "Zgłoszenia"; break;
                    case "nagroda": reasonName = "Odbiór nagrody"; break;
                    case "inne": reasonName = "Inne"; break;
                    case "zarzad":
                        reasonName = "Sprawa do zarządu serwera";
                        pingRole = config.ZARZAD_GLOWNY2_ROLE_ID // specjalny ping
                        break;
                    case "odwolanie_ban": reasonName = "Odwołanie od bana"; break;
                    default: reasonName = "Ticket";
                }

                const guild = interaction.guild;

                const ticketChannel = await guild.channels.create({
                    name: `ticket-${interaction.user.username}`.toLowerCase(),
                    type: 0,
                    parent: config.TICKET_CATEGORY_ID,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ["ViewChannel"]
                        },
                        {
                            id: interaction.user.id,
                            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
                        },
                        {
                            id: config.TICKET_STAFF2_ROLE_ID,
                            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
                        }
                    ]
                });

                // EMBED — OSOBNY DLA KAŻDEGO TYPU
                let embed;

                switch (value) {

                    case "partnerstwo":
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("🤝 Partnerstwo — PROJECT NLEX")
                            .setDescription(
                `Witaj ${interaction.user}! 

Podaj szczegóły dotyczące partnerstwa:

- Nazwa projektu
- Link do serwera na pv
- Powód partnerstwa`
                            )
                            .setTimestamp();
                        break;

                    case "zgloszenia":
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("📢 Zgłoszenia — PROJECT NLEX")
                            .setDescription(
                `Witaj ${interaction.user}! 

Opisz dokładnie swoje zgłoszenie:

- Nick gracza oskarżonego
- Nick zgłaszającego
- Co się wydarzyło?
- Kto brał udział
- Dowody (screeny, nagrania)`
                            )
                            .setTimestamp();
                        break;

                    case "nagroda":
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("🎁 Odbiór nagrody — PROJECT NLEX")
                            .setDescription(
                `Witaj ${interaction.user}! 

Podaj informacje:

- Za co jest nagroda?
- Kiedy została zdobyta?
- Jaki typ nagrody odbierasz?`
                            )
                            .setTimestamp();
                        break;

                    case "inne":
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("❓ Inne zgłoszenie — PROJECT NLEX")
                            .setDescription(
                `Witaj ${interaction.user}!

Opisz swoją sprawę jak najdokładniej, a administracja odpowie ci w ciągu 24h.`
                            )
                            .setTimestamp();
                        break;

                    case "zarzad":
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("⚠️ Sprawa do zarządu głównego — PROJECT NLEX")
                            .setDescription(
                `Witaj ${interaction.user}!

Podaj szczegóły dotyczące partnerstwa:

- Co się stało?
- Kogo dotyczy?
- Dlaczego wymaga interwencji zarządu?`
                            )
                            .setTimestamp();
                        break;

                    case "odwolanie_ban":
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("🚫 Odwołanie od bana — PROJECT NLEX")
                            .setDescription(
                `Witaj ${interaction.user}! 

Podaj informacje:

- Powód bana
- Kiedy został nadany
- Dlaczego uważasz, że powinien zostać odjęty`
                            )
                            .setTimestamp();
                        break;

                    default:
                        embed = new EmbedBuilder()
                            .setColor(0x90EE90)
                            .setTitle("🎫 Ticket — PROJECT NLEX")
                            .setDescription(`Witaj ${interaction.user}!`)
                            .setTimestamp();
                }

                // PRZYCISKI
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("ticket_Secondary")
                        .setLabel("Przyjmij zgłoszenie")
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId("ticket_close")
                        .setLabel("Zamknij ticket")
                        .setStyle(ButtonStyle.Secondary)
                );

                await ticketChannel.send({
                    content: `<@&${pingRole}>`,
                    embeds: [embed],
                    components: [buttons]
                });

                return interaction.reply({
                    content: `✔ Ticket utworzony: ${ticketChannel}`,
                    ephemeral: true
                });
            }
        }
        // ============================
        // OBSŁUGA PRZYCISKÓW TICKETÓW
        // ============================
        if (interaction.isButton()) {

            // ROLE UPRAWNIONE
            const staffRole = config.TICKET_STAFF2_ROLE_ID;
            const zarzadRole = config.ZARZAD_GLOWNY2_ROLE_ID;
            const partnerstwoRole = config.PARTNERSTWO_STAFF2_ROLE_ID;

            const isStaff = interaction.member.roles.cache.has(staffRole);
            const isZarzad = interaction.member.roles.cache.has(zarzadRole);
            const isPartnerstwo = interaction.member.roles.cache.has(partnerstwoRole);

            // BLOKADA DLA INNYCH
            if (!isStaff && !isZarzad && !isPartnerstwo) {
                return interaction.reply({
                    content: "❌ Nie masz uprawnień do obsługi tego ticketu.",
                    ephemeral: true
                });
            }

            // PRZYJĘCIE TICKETU
            if (interaction.customId === "ticket_accept") {

                await interaction.deferUpdate().catch(() => {});
                await interaction.channel.send(
                    `✔ Zgłoszenie zostało przyjęte przez ${interaction.user}.`
                );
                return;
            }

            // ZAMKNIĘCIE TICKETU
            if (interaction.customId === "ticket_close") {

                await interaction.deferUpdate().catch(() => {});
                await interaction.channel.send("🔒 Ticket zostanie zamknięty za 3 sekundy.");

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 3000);

                return;
            }
        }

    } catch (err) {
        console.error("Błąd w interactionCreate:", err);
        if (interaction.isRepliable()) {
            interaction.reply({
                content: "❌ Wystąpił błąd podczas przetwarzania interakcji.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});


// ============================
// LOGOWANIE BOTA
// ============================
client.login(process.env.TOKEN);

