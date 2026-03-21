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

        // URZĄD – PANEL Z SELECT MENU
        const urzadChannel = guild.channels.cache.get(config.URZAD_PANEL_CHANNEL_ID);
        if (urzadChannel) {
            const embedUrzad = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:mod:1479847501149372467> Urząd Miejski   
Witaj w oficjalnym panelu Urzędu Miejskiego.

Poniżej znajdziesz główne sekcje, które pozwolą Ci szybko i wygodnie załatwić najważniejsze sprawy urzędowe na naszym serwerze. Każda z dostępnych opcji prowadzi do osobnego procesu obsługi, dzięki czemu Twoje zgłoszenie trafi dokładnie tam, gdzie powinno.

🪪 • Dowód osobisty  
🚗 • Prawo jazdy  
📨 • Zapytanie do urzędu  
👮 • Oferty pracy (Policjant)  
🏢 • Załóż firmę`
                );

            const menu = new StringSelectMenuBuilder()
                .setCustomId("urzad_menu")
                .setPlaceholder("Wybierz usługę urzędu")
                .addOptions([
                    { label: "Dowód osobisty", value: "dowod" },
                    { label: "Wniosek o prawo jazdy", value: "prawko" },
                    { label: "Zapytanie do urzędu", value: "zapytanie" },
                    { label: "Oferty pracy – Policjant", value: "praca_policjant" },
                    { label: "Załóż firmę", value: "firma" }
                ]);

            const rowUrzad = new ActionRowBuilder().addComponents(menu);

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
    });

    // ============================
    // SELECT MENU — URZĄD
    // ============================
    client.on("interactionCreate", async interaction => {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== "urzad_menu") return;

        const value = interaction.values[0];

        // DOWÓD — MODAL (BEZ TICKETA)
        if (value === "dowod") {
            const modal = new ModalBuilder()
                .setCustomId("dowod_modal")
                .setTitle("Wniosek o dowód osobisty");

            const input1 = new TextInputBuilder()
                .setCustomId("d_imie")
                .setLabel("Imię i nazwisko")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const input2 = new TextInputBuilder()
                .setCustomId("d_data")
                .setLabel("Data urodzenia")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const input3 = new TextInputBuilder()
                .setCustomId("d_adres")
                .setLabel("Adres zamieszkania")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(input1),
                new ActionRowBuilder().addComponents(input2),
                new ActionRowBuilder().addComponents(input3)
            );

            return interaction.showModal(modal);
        }

        // RESZTA OPCJI — TICKET
        const ticket = await interaction.guild.channels.create({
            name: `urzad-${interaction.user.username}`,
            type: 0,
            parent: config.URZAD_CATEGORY_ID,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ["ViewChannel"] },
                { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
            ]
        });

        let embed;

        if (value === "prawko") {
            embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("🚗 Wniosek o prawo jazdy")
                .setDescription(
`Odpowiedz na pytania:

1️⃣ Jaką kategorię prawa jazdy chcesz uzyskać?  
2️⃣ Czy posiadasz wymagane dokumenty?  
3️⃣ Dlaczego chcesz uzyskać prawo jazdy?`);
        }

        if (value === "zapytanie") {
            embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("📨 Zapytanie do urzędu")
                .setDescription(
"Opisz swoją sprawę poniżej — postaraj się podać jak najwięcej szczegółów."
                );
        }

        if (value === "praca_policjant") {
            embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("👮 Rekrutacja – Policjant")
                .setDescription(
`Odpowiedz na pytania:

1️⃣ Dlaczego chcesz zostać policjantem?  
2️⃣ Czy masz doświadczenie w służbach / RP?  
3️⃣ Jak radzisz sobie w stresujących sytuacjach?  
4️⃣ Czy potrafisz pracować w zespole?`);
        }

        if (value === "firma") {
            embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("🏢 Wniosek o założenie firmy")
                .setDescription(
`Odpowiedz na pytania:

1️⃣ Nazwa firmy  
2️⃣ Rodzaj działalności  
3️⃣ Lokalizacja  
4️⃣ Powód założenia firmy  
5️⃣ Ilu pracowników planujesz zatrudnić?`);
        }

        await ticket.send({ content: `${interaction.user}`, embeds: [embed] });

        return interaction.reply({
            content: "Ticket został utworzony!",
            ephemeral: true
        });
    });

    // ============================
    // SELECT MENU — regulaminy + prawo jazdy (TWÓJ STARY SYSTEM)
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

        // (jeśli chcesz, tu możesz też zostawić swój stary system pj_kategoria)
    });

    // ============================
    // MODAL — weryfikacja + dowód
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isModalSubmit()) return;

        // WERYFIKACJA
        if (interaction.customId === "verification_modal") {
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
        }

        // DOWÓD OSOBISTY
        if (interaction.customId === "dowod_modal") {
            const imie = interaction.fields.getTextInputValue("d_imie");
            const data = interaction.fields.getTextInputValue("d_data");
            const adres = interaction.fields.getTextInputValue("d_adres");

            const kanal = interaction.guild.channels.cache.get(config.DOWODY_CHANNEL_ID);

            if (kanal) {
                await kanal.send(
`<:osoba:1479761131206611078> **Nowy wniosek o dowód osobisty**
Użytkownik: ${interaction.user}
Imię i nazwisko: ${imie}
Data urodzenia: ${data}
Adres: ${adres}`
                );
            }

            return interaction.reply({
                content: "Twój wniosek o dowód został wysłany!",
                ephemeral: true
            });
        }
    });
};
