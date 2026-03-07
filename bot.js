const { 
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    InteractionType, StringSelectMenuBuilder
} = require("discord.js");

const client = new Client({
   intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
]
});

// ID SERWERA I KANAŁÓW
const GUILD_ID = "1478750576408793239";
const VERIFY_CHANNEL_ID = "1478782389248327720";
const ADMIN_CHANNEL_ID = "1478787933350658138";
const WELCOME_CHANNEL_ID = "1479172496627339417";
const URZAD_CATEGORY_ID = "1479814526588420137";
const URZAD_PANEL_CHANNEL_ID = "1479789580118130869";   
const DOWODY_CHANNEL_ID = "1479848426295267470";       

// BOT READY
client.once("ready", async () => {
    console.log(`Bot działa jako ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    // ============================
    // 🔹 WERYFIKACJA — automatycznie
    // ============================
    const verifyChannel = guild.channels.cache.get(VERIFY_CHANNEL_ID);

    if (verifyChannel) {
        const embedVerify = new EmbedBuilder()
            .setDescription(
`# <:konfetti:1479760987790770288> Weryfikacja Roblox 

Kliknij przycisk znajdujący się poniżej, aby wprowadzić swój prawidłowy nick Roblox — wymagamy nazwy konta, a nie display name.
Informacja ta jest potrzebna, abyśmy mogli poprawnie przeprowadzić proces weryfikacji i upewnić się, że podane dane są zgodne z Twoim profilem w grze.
Prosimy o dokładne wpisanie nicku, z zachowaniem wielkości liter oraz pełnej pisowni, ponieważ wszelkie błędy mogą spowodować konieczność ponownego przejścia weryfikacji.`)
            .setColor("Orange");

        const rowVerify = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("start_verification")
                .setLabel("Zweryfikuj się")
                .setStyle(ButtonStyle.Secondary)
        );

        verifyChannel.send({ embeds: [embedVerify], components: [rowVerify] });
    }

    // ============================
    // 🔹 URZĄD — automatycznie
    // ============================
    const urzadChannel = guild.channels.cache.get(URZAD_PANEL_CHANNEL_ID);

    if (urzadChannel) {
        const embedUrzad = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
`# <:mod:1479847501149372467> Urząd Miejski

Witaj w oficjalnym panelu Urzędu Miejskiego.

Poniżej znajdziesz trzy główne sekcje, które pozwolą Ci szybko i wygodnie załatwić najważniejsze sprawy urzędowe na naszym serwerze. Każda z dostępnych opcji prowadzi do osobnego procesu obsługi, dzięki czemu Twoje zgłoszenie trafi dokładnie tam, gdzie powinno.

• **Dowód osobisty**  
  Wybierz tę opcję, jeśli chcesz złożyć wniosek o wydanie dowodu osobistego. Zostaniesz poproszony o podanie podstawowych danych, takich jak imię, nazwisko, płeć oraz obywatelstwo. Po wypełnieniu formularza Twój wniosek zostanie automatycznie przesłany do odpowiedniego działu.

• **Prawo jazdy**  
  Ta sekcja umożliwia złożenie wniosku o prawo jazdy w wybranej kategorii.  
  **Wymagane jest wcześniejsze zakupienie odpowiedniego prawa jazdy w sklepie serwera.**  
  Po wybraniu kategorii zostanie utworzony specjalny kanał, w którym dokończysz proces składania wniosku.

• **Zapytanie do urzędu**  
  Jeśli masz pytanie, wątpliwość lub chcesz zgłosić sprawę wymagającą indywidualnego rozpatrzenia, wybierz tę opcję. Otworzy się kanał, w którym będziesz mógł opisać swój problem, a administracja udzieli Ci odpowiedzi.
`);

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

        urzadChannel.send({ embeds: [embedUrzad], components: [rowUrzad] });
    }

    console.log("Panele weryfikacji i urzędu zostały wysłane!");
});

// ============================
// 🔹 KOMENDY TEKSTOWE (BEZ ZMIAN)
// ============================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!regulamin") {
        const embed = new EmbedBuilder()
            .setDescription(`# <:koperta:1479760548500471830> Regulamin serwera

Kliknij przycisk poniżej i wybierz regulamin który chcesz przeczytać.`)
            .setColor("Orange");

        const button = new ButtonBuilder()
            .setCustomId("regulamin_przycisk")
            .setLabel("Zobacz regulaminy")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(button);

        message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === "!ping") {
        message.channel.send("Pong! <:rakieta:1479760849835917342> Bot działa!");
    }
});

// ============================
// 🔹 INTERAKCJE
// ============================
client.on("interactionCreate", async (interaction) => {

    // ============================
    // 🔹 PRZYCISKI
    // ============================
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
                .addOptions([
                    { label: "Regulamin Discord", value: "discord" },
                    { label: "Regulamin Roblox", value: "roblox" },
                    { label: "Taryfikator Discord", value: "taryfikator_discord" },
                    { label: "Taryfikator Roblox", value: "taryfikator_roblox" }
                ]);

            return interaction.reply({
                content: "Wybierz co chcesz przeczytać:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // ============================
        // 🔹 DOWÓD — MODAL (BEZ TICKETU)
        // ============================
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

        // ============================
        // 🔹 PRAWO JAZDY — MENU
        // ============================
        if (interaction.customId === "pj_start") {
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
                content: "Wybierz kategorię prawa jazdy:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // ============================
        // 🔹 PRZYJĘCIE ZGŁOSZENIA (tylko właściciel, tylko raz)
        // ============================
        if (interaction.customId === "ticket_accept") {

            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: "❌ Tylko właściciel serwera może przyjmować zgłoszenia.",
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
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.message.edit({
                components: [newRow]
            });

            return interaction.reply({
                content: `✔️ Zgłoszenie zostało przyjęte przez ${interaction.user}.`,
                ephemeral: false
            });
        }

        // ============================
        // 🔹 ZAMYKANIE TICKETA
        // ============================
        if (interaction.customId === "ticket_close") {
            return interaction.channel.delete();
        }
    }

    // ============================
    // 🔹 MODALE
    // ============================
    if (interaction.type === InteractionType.ModalSubmit) {

        // WERYFIKACJA
        if (interaction.customId === "verification_modal") {
            const nick = interaction.fields.getTextInputValue("roblox_nick");
            const adminChannel = interaction.guild.channels.cache.get(ADMIN_CHANNEL_ID);

            if (adminChannel) {
                adminChannel.send(
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

        // ============================
        // 🔹 DOWÓD — WYSYŁANIE NA KANAŁ (BEZ TICKETU)
        // ============================
        if (interaction.customId === "dowod_modal") {

            const imie = interaction.fields.getTextInputValue("dowod_imie");
            const nazwisko = interaction.fields.getTextInputValue("dowod_nazwisko");
            const plec = interaction.fields.getTextInputValue("dowod_plec");
            const obywatelstwo = interaction.fields.getTextInputValue("dowod_obywatelstwo");

            const dowodyChannel = interaction.guild.channels.cache.get(DOWODY_CHANNEL_ID);

            if (dowodyChannel) {
                const embedData = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("📄 Nowy dowód osobisty")
                    .setDescription(
`**Użytkownik:** ${interaction.user}

**Imię:** ${imie}
**Nazwisko:** ${nazwisko}
**Płeć:** ${plec}
**Obywatelstwo:** ${obywatelstwo}`
                    );

                dowodyChannel.send({ embeds: [embedData] });
            }

            return interaction.reply({
                content: "Twój wniosek o dowód został wysłany!",
                ephemeral: true
            });
        }
    }

    // ============================
    // 🔹 SELECT MENU — REGULAMINY (BEZ ZMIAN)
    // ============================
    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];

        if (value === "discord") {
            return interaction.reply({
                content: `# <:koperta:1479760548500471830> Regulamin Discord

  1. Zachowanie ogólne
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
                content: `# <:pad:1479760675533492224> Regulamin Roblox 
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
                content: `# <:mlot:1479760749541855362> Taryfikator Discord

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
                content: `# <:mlot:1479760749541855362> Taryfikator Roblox

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

    // ============================
    // 🔹 PRAWO JAZDY — TICKET
    // ============================
    if (interaction.customId === "pj_kategoria") {
        const kat = interaction.values[0];

        const ticket = await interaction.guild.channels.create({
            name: `prawojazdy-${interaction.user.username}`,
            type: 0,
            parent: URZAD_CATEGORY_ID
        });

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(`# 🚗 Wniosek o prawo jazdy

Wybrałeś kategorię **${kat}**.

Podaj swoje dane, aby kontynuować.`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_accept")
                .setLabel("Przyjmij zgłoszenie")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("ticket_close")
                .setLabel("Zamknij ticket")
                .setStyle(ButtonStyle.Danger)
        );

        ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
        return interaction.reply({ content: "Ticket został utworzony!", ephemeral: true });
    }

    // ============================
    // 🔹 PYTANIE — TICKET
    // ============================
    if (interaction.customId === "urzad_pytanie") {
        const ticket = await interaction.guild.channels.create({
            name: `pytanie-${interaction.user.username}`,
            type: 0,
            parent: URZAD_CATEGORY_ID
        });

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(`# ❓ Zapytanie do urzędu

Opisz swój problem lub pytanie.`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_accept")
                .setLabel("Przyjmij zgłoszenie")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("ticket_close")
                .setLabel("Zamknij ticket")
                .setStyle(ButtonStyle.Danger)
        );

        ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
        return interaction.reply({ content: "Ticket został utworzony!", ephemeral: true });
    }

});

// ============================
// 🔹 POWITANIE (BEZ ZMIAN)
// ============================
client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle("<:osoba:1479761131206611078> Nowy gracz na serwerze!")
        .setDescription(`Witaj ${member.user}, cieszymy się, że dołączyłeś do naszej społeczności!`)
        .setColor("Orange")
        .setThumbnail(member.user.displayAvatarURL());

    channel.send({ embeds: [embed] });
});

// LOGIN
client.login(process.env.TOKEN);
