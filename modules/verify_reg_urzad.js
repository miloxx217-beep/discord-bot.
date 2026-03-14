const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require("discord.js");

module.exports = (client, shared) => {

    const { config } = shared;

    // ============================
    // READY — panele weryfikacji i urzędu
    // ============================
    client.once("ready", async () => {
        console.log("[verify_reg_urzad] Załadowano moduł weryfikacji / urzędu.");

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
    });

    // ============================
    // MESSAGE — !regulamin, !ping
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
    // PRZYCISKI
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        // WERYFIKACJA — otwarcie modala
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

        // REGULAMINY — otwarcie select menu
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

        // PRAWO JAZDY — wybór kategorii
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

        // PYTANIE DO URZĘDU — ticket
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
                !interaction.member.roles.cache.has(config.WLASCICIEL_ROLE_ID) &&
                !interaction.member.roles.cache.has(config.EGZAMINATOR_ROLE_ID)
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
                !interaction.member.roles.cache.has(config.WLASCICIEL_ROLE_ID) &&
                !interaction.member.roles.cache.has(config.EGZAMINATOR_ROLE_ID)
            ) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            return interaction.channel.delete();
        }
    });

    // ============================
    // SELECT MENU — regulaminy + prawo jazdy
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

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
6. Cheaty / Exploity – permanentny ban  
7. Podszywanie się pod administrację – 7 dni bana  
8. Reklama / phishing – permanentny ban`,
                    ephemeral: true
                });
            }
        }

        // PRAWO JAZDY — ticket
        if (interaction.customId === "pj_kategoria") {
            const ticket = await interaction.guild.channels.create({
                name: `prawojazdy-${interaction.user.username}`,
                type: 0,
                parent: config.URZAD_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: config.EGZAMINATOR_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
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
Prosimy jedynie o cierpliwość — egzaminator skontaktuje się z Tobą w ciągu 24 godzin, aby przekazać dalsze instrukcje dotyczące procesu egzaminacyjnego.

Aby usprawnić procedurę, prosimy o podanie w tym ticketcie dogodnej dla Ciebie godziny, w której egzaminator może się z Tobą skontaktować.`);

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

    // ============================
    // MODAL — weryfikacja
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== "verification_modal") return;

        const nick = interaction.fields.getTextInputValue("roblox_nick");
        const adminChannel = interaction.guild.channels.cache.get(config.ADMIN_CHANNEL_ID);

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
    });
};
