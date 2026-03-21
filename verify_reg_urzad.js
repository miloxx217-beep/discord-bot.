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

        // WERYFIKACJA PANEL
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

        // URZĄD PANEL
        const urzadChannel = guild.channels.cache.get(config.URZAD_PANEL_CHANNEL_ID);
        if (urzadChannel) {
            const embedUrzad = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:mod:1479847501149372467> Urząd Miejski

Witaj w oficjalnym panelu Urzędu Miejskiego.  
To tutaj załatwisz wszystkie najważniejsze sprawy administracyjne na serwerze.

Poniżej znajdziesz dostępne usługi:

# • Dowód osobisty  
Złóż wniosek o wydanie dowodu osobistego. Podasz podstawowe dane, a urząd zajmie się resztą.

# • Prawo jazdy  
Wybierz kategorię prawa jazdy i otwórz ticket, w którym dokończysz proces wniosku.  
*Wymagany wcześniejszy zakup prawa jazdy w sklepie serwera.*

# • Zapytanie do urzędu  
Masz pytanie lub sprawę do administracji? Otwórz ticket i opisz problem.

# • Oferty pracy
Zgłoś chęć dołączenia do służb. W ticketcie odpowiesz na pytania rekrutacyjne.

# • Załóż firmę 
Chcesz otworzyć własną działalność? W ticketcie podasz nazwę, profil firmy i podstawowe informacje.`);

            const menu = new StringSelectMenuBuilder()
                .setCustomId("urzad_menu")
                .setPlaceholder("Wybierz usługę")
                .addOptions([
                    { label: "Dowód osobisty", value: "dowod" },
                    { label: "Prawo jazdy", value: "prawko" },
                    { label: "Zapytanie do urzędu", value: "zapytanie" },
                    { label: "Oferty pracy – Policjant", value: "praca_policjant" },
                    { label: "Załóż firmę", value: "firma" },
                    { label: "Kodeks ruchu drogowego", value: "kodeks" }
                ]);

            await urzadChannel.send({
                embeds: [embedUrzad],
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }
    });

    // ============================
    // POWITANIE NOWEGO GRACZA
    // ============================
    client.on("guildMemberAdd", async (member) => {

        const channel = member.guild.channels.cache.get("1479172496627339417");
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setAuthor({
                name: "<:osoba:1479761131206611078> Nowy gracz na serwerze!",
                iconURL: member.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(
`Witaj ${member}, cieszymy się, że dołączyłeś do naszej społeczności! <:rakieta:1479760849835917342>
Pamiętaj, aby przejść weryfikację i zapoznać się z regulaminem.`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await channel.send({ embeds: [embed] });
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

            await message.channel.send({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });
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

        // WERYFIKACJA — MODAL
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

        // TICKET — PRZYJĘCIE
        if (interaction.customId === "ticket_accept") {
            await interaction.reply({
                content: `<:ptaszek:1479761065850962020> Zgłoszenie zostało przyjęte przez ${interaction.user}.`,
                ephemeral: false
            });
            return;
        }

        // TICKET — ZAMKNIĘCIE
        if (interaction.customId === "ticket_close") {
            await interaction.reply({ content: "🔒 Ticket zostanie zamknięty.", ephemeral: true });
            return interaction.channel.delete().catch(() => {});
        }

        // REGULAMINY — SELECT MENU
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
                content: "Wybierz regulamin:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }
    });

    // ============================
    // SELECT MENU — URZĄD + REGULAMINY
    // ============================
    client.on("interactionCreate", async interaction => {
        if (!interaction.isStringSelectMenu()) return;

        // ----------------------------
        // REGULAMINY
        // ----------------------------
        if (interaction.customId === "wybor_regulaminu") {
            const value = interaction.values[0];

            const texts = {
                discord: `Regulamin Discord

Regulamin Discord
1.Zachowanie ogólne
1.1 Zachowuj się kulturalnie i z szacunkiem wobec innych.
1.2 Zabronione jest obrażanie, wyzywanie i grożenie innym.
1.3 Spamowanie lub floodowanie → niedozwolone.

2.Roleplay / Postacie
2.1 Odgrywaj swoją postać spójnie i logicznie.
2.2 Tworzenie postaci powinno być zgodne z zasadami serwera.

3.Kanały i komunikacja
3.1 Korzystaj z kanałów zgodnie z ich przeznaczeniem.
3.2 Zachowuj kulturę na kanałach głosowych.
3.3 Nie publikuj treści NSFW ani materiałów nielegalnych.

4.Treści, reklama i administracja
4.1 Materiały i linki muszą być legalne.
4.2 Reklama bez zgody administracji jest zabroniona.
4.3 Postępuj zgodnie z poleceniami administracji i moderatorów.`,

                roblox: `Regulamin Roblox

Zakazuje się:
1. FRP – odgrywanie nielogiczne  
2. RDM – zabijanie bez powodu  
3. VDM – zabijanie pojazdami  
4. Power Gaming  
5. Meta Gaming  
6. Cheaty / Exploity  
7. Podszywanie się pod administrację  
8. Reklama / linki phishingowe`,

                taryfikator_discord: `Taryfikator Discord

1.Zachowanie ogólne
1.1 Obraźliwe zachowanie → Ostrzeżenie
1.2 Powtarzające się wykroczenia → Tymczasowe wyciszenie
1.3 Spam / flood → Ostrzeżenie

2.Roleplay / Postacie
2.1 Nieprzestrzeganie zasad RP → Ostrzeżenie
2.2 Tworzenie postaci niezgodnie z zasadami → Ostrzeżenie

3.Kanały i komunikacja
3.1 Nieodpowiednie użycie kanałów → Tymczasowe wyciszenie
3.2 Zakłócanie rozmów głosowych → Ostrzeżenie
3.3 Publikowanie treści NSFW / nielegalnych → PERMANENTNY BAN

4.Treści i materiały / Reklama / Administracja
4.1 Udostępnianie nielegalnych linków → PERMANENTNY BAN
4.2 Nieautoryzowana reklama → PERMANENTNY BAN
4.3 Lekceważenie poleceń administracji → Ostrzeżenie / czasowy ban`,

                taryfikator_roblox: `Taryfikator Roblox

1.FRP – 1 dzień bana
2.RDM – 1–3 dni bana
3.VDM – 1–3 dni bana
4.Power Gaming – 3 dni bana
5.Meta Gaming – 3 dni bana
6.Cheaty / Exploity – permanentny ban
7.Podszywanie się pod administrację – 7 dni bana
8.Reklama / phishing – permanentny ban`
            };

            return interaction.reply({
                content: texts[value],
                ephemeral: true
            });
        }

        // ----------------------------
        // URZĄD MENU + PRAWKO KATEGORIA
        // ----------------------------
        if (interaction.customId !== "urzad_menu" && interaction.customId !== "prawko_kategoria") return;

        const value = interaction.values[0];

        // DOWÓD — MODAL
        if (interaction.customId === "urzad_menu" && value === "dowod") {
            const modal = new ModalBuilder()
                .setCustomId("dowod_modal")
                .setTitle("Wniosek o dowód osobisty");

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

        // PRAWO JAZDY — WYBÓR KATEGORII
        if (interaction.customId === "urzad_menu" && value === "prawko") {
            const menu = new StringSelectMenuBuilder()
                .setCustomId("prawko_kategoria")
                .setPlaceholder("Wybierz kategorię prawa jazdy")
                .addOptions(
                    { label: "Kategoria B", value: "B" },
                    { label: "Kategoria A", value: "A" },
                    { label: "Kategoria C", value: "C" },
                    { label: "Kategoria D", value: "D" },
                    { label: "Kategoria C+E", value: "CE" },
                    { label: "Kategoria T", value: "T" }
                );

            return interaction.reply({
                content: "Wybierz kategorię prawa jazdy:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // PRAWO JAZDY — TWORZENIE TICKETA PO WYBORZE KATEGORII
        if (interaction.customId === "prawko_kategoria") {
            const kat = value; // B, A, C, D, CE, T
            const ticketName = `prawojazdy${kat}-${interaction.user.username}`;

            const ticket = await interaction.guild.channels.create({
                name: ticketName,
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
`# <:koperta:1479760548500471830> Wniosek o prawo jazdy — kategoria ${kat}

Dziękujemy za złożenie wniosku o wydanie prawa jazdy.
Twój wniosek został pomyślnie zarejestrowany w systemie Urzędu Miejskiego.

Na tym etapie nie musisz podawać żadnych dodatkowych danych.
Prosimy jedynie o cierpliwość — egzaminator skontaktuje się z Tobą w ciągu 24 godzin, aby przekazać dalsze instrukcje dotyczące procesu egzaminacyjnego.

Aby usprawnić procedurę, prosimy o podanie w tym ticketcie dogodnej dla Ciebie godziny, w której egzaminator może się z Tobą skontaktować.`
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_accept")
                    .setLabel("Przyjmij zgłoszenie")
                    .setStyle(ButtonStyle.Secronadry),
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("Zamknij ticket")
                    .setStyle(ButtonStyle.Seconadary)
            );

            await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [buttons] });

            return interaction.reply({
                content: `Ticket został utworzony: ${ticket}`,
                ephemeral: true
            });
        }

        // KODEKS RUCHU DROGOWEGO — TYLKO EMBED
        if (interaction.customId === "urzad_menu" && value === "kodeks") {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:mlot:1479760749541855362> Kodeks ruchu drogowego

Zatrzymanie na środku skrzyżowania – 1500 €
    •    Cofanie w miejscu niedozwolonym – 1300 €
    •    Zawracanie na skrzyżowaniu – 1400 €
    •    Nieużycie kierunkowskazu – 1000 €
    •    Wymuszenie pierwszeństwa na rondzie – 1800 €
    •    Jazda po chodniku – 2500 €
    •    Blokowanie pasa ruchu – 1400 €
    •    Wjazd w strefę zakazu – 2000 €
    •    Nielegalny postój na przejściu dla pieszych – 1600 €
    •    Uszkodzenie znaku drogowego – 1000 €
    •    Ignorowanie poleceń policji – 4500 €
    •    Niebezpieczna zmiana pasa ruchu – 1700 €
    •    Wyprzedzanie w miejscu zabronionym – 2000 €
    •    Ucieczka przed policją nie popełniając wykroczenia - 5000 €
    •    Ucieczka przed policją po popełnieniu wykroczenia - 8000 €`
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // POZOSTAŁE OPCJE URZĘDU — TICKETY
        if (interaction.customId === "urzad_menu") {
            let ticketName = `urzad-${interaction.user.username}`;

            if (value === "firma") ticketName = `firma-${interaction.user.username}`;
            if (value === "praca_policjant") ticketName = `praca-${interaction.user.username}`;
            if (value === "zapytanie") ticketName = `zapytanie-${interaction.user.username}`;

            const ticket = await interaction.guild.channels.create({
                name: ticketName,
                type: 0,
                parent: config.URZAD_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            let embed;

            if (value === "zapytanie") {
                embed = new EmbedBuilder()
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

Zachowaj kulturę wypowiedzi i nie spamuj wiadomościami — każda sprawa zostanie zauważona.`)
            }

            if (value === "praca_policjant") {
                embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("👮 Rekrutacja – Policjant")
                    .setDescription(
`# <:mod:1479847501149372467> Rekrutacja – Policjant

Odpowiedz na poniższe pytania:

1. **Dlaczego chcesz dołączyć do służby w Policji?**
Opisz swoją motywację, powody oraz to, co skłoniło Cię do wybrania właśnie tej ścieżki.

2. **Jakie cechy charakteru sprawiają, że nadajesz się na funkcjonariusza Policji?**
Uwzględnij m.in. odporność na stres, umiejętność pracy w zespole, komunikatywność, opanowanie.

3. **Czy posiadasz jakiekolwiek doświadczenie związane z pracą w służbach mundurowych lub rolach wymagających odpowiedzialności?**
Jeśli tak — opisz dokładnie jakie.

4. **Jak zachowałbyś się w sytuacji zagrożenia życia lub zdrowia obywatela?**
Opisz krok po kroku, jak podejmujesz decyzje w stresie.

5. **Co zrobisz, jeśli zauważysz, że inny funkcjonariusz łamie przepisy lub nadużywa uprawnień?**
Wyjaśnij, jak rozumiesz etykę służby.

6. **Jak oceniasz swoją znajomość przepisów ruchu drogowego oraz podstawowych procedur policyjnych?**
Napisz szczerze — w razie potrzeby zapewnimy szkolenie.

7. **Jakie są Twoje mocne i słabe strony?**
Opisz je w kontekście pracy w Policji.

8. **Czy jesteś gotów pracować w sytuacjach trudnych, konfliktowych lub niebezpiecznych?**
Wyjaśnij dlaczego tak / dlaczego nie.

9. **Jak reagujesz na krytykę lub polecenia przełożonych?**
Opisz swoje podejście do hierarchii i dyscypliny.

10. **Dlaczego powinniśmy wybrać właśnie Ciebie?**
To Twoja szansa, aby się wyróżnić — opisz, co możesz wnieść do jednostki.`
                    );
            }

            if (value === "firma") {
                embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setDescription(
`# <:mlot:1479760749541855362 Wniosek o założenie firmy>

# :mlot: Co powinieneś zawrzeć w zgłoszeniu:

- Nazwa i rodzaj firmy – podaj dokładnie, czym będzie się zajmować Twoja firma.

- Szczegóły działalności – opisz, w jaki sposób Twoja firma będzie funkcjonować w świecie RP, jakie usługi lub produkty będzie oferować.

- Zespół – czy planujesz prowadzić firmę samodzielnie, czy we współpracy z innymi graczami? Jeśli z innymi, podaj ich role i zakres obowiązków.

- Potrzeba firmy – wyjaśnij, dlaczego Twoja firma jest potrzebna na serwerze i jakie korzyści przyniesie społeczności.

- Dodatkowe informacje – wszelkie inne pomysły lub szczegóły, które pomogą administracji w ocenie Twojej propozycji.

# :ptaszek: Wskazówki:

- Pisz szczegółowo i przemyślanie – im więcej informacji podasz, tym łatwiej administracja oceni Twoje zgłoszenie.

- Twoje zgłoszenie będzie traktowane jak oficjalne podanie RP – pamiętaj o spójności i zgodności z zasadami serwera.

- Zgłoszenia niekompletne lub zbyt ogólne mogą zostać odrzucone lub poproszone o doprecyzowanie.

**Teraz czas na Ciebie!**

Opisz swoją firmę tak, jakbyś przedstawiał ją całemu miastu – pokaż swoją wizję i kreatywność.`
                    );
            }

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_accept")
                    .setLabel("Przyjmij zgłoszenie")
                    .setStyle(ButtonStyle.Seconadry),
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("Zamknij ticket")
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [buttons] });

            return interaction.reply({
                content: `Ticket został utworzony: ${ticket}`,
                ephemeral: true
            });
        }
    });

    // ============================
    // MODALE — WERYFIKACJA + DOWÓD
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
                content: "Twój nick został wysłany do weryfikacji!",
                ephemeral: true
            });
        }

        // DOWÓD OSOBISTY
        if (interaction.customId === "dowod_modal") {
            const imie = interaction.fields.getTextInputValue("d_imie");
            const nazwisko = interaction.fields.getTextInputValue("d_nazwisko");
            const plec = interaction.fields.getTextInputValue("d_plec");
            const obywatelstwo = interaction.fields.getTextInputValue("d_obywatelstwo");

            const numer = Math.floor(100000 + Math.random() * 900000);

            const kanal = interaction.guild.channels.cache.get(config.DOWODY_CHANNEL_ID);

            if (kanal) {
                kanal.send(
`# <:koperta:1479760548500471830> Nowy dowód osobisty

Użytkownik: ${interaction.user}

**Imię:** ${imie}  
**Nazwisko:** ${nazwisko}  
**Płeć:** ${plec}  
**Obywatelstwo:** ${obywatelstwo}  

**Numer dowodu:** ${numer}`
                );
            }

            return interaction.reply({
                content: "Twój wniosek o dowód został wysłany!",
                ephemeral: true
            });
        }
    });
};
