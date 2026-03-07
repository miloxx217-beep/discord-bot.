
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

// BOT READY
client.once("ready", async () => {
    console.log(`Bot działa jako ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    const channel = guild.channels.cache.get(VERIFY_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setDescription(
`# <:konfetti:1479760987790770288> Weryfikacja Roblox 

Kliknij przycisk znajdujący się poniżej, aby wprowadzić swój prawidłowy nick Roblox — wymagamy nazwy konta, a nie display name.  
Informacja ta jest potrzebna, abyśmy mogli poprawnie przeprowadzić proces weryfikacji i upewnić się, że podane dane są zgodne z Twoim profilem w grze.  
Prosimy o dokładne wpisanie nicku, z zachowaniem wielkości liter oraz pełnej pisowni, ponieważ wszelkie błędy mogą spowodować konieczność ponownego przejścia weryfikacji.`
    )
    .setColor("Orange");

channel.send({ embeds: [embed] });


    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("start_verification")
            .setLabel("Zweryfikuj się")
            .setStyle(ButtonStyle.Secondary)
    );

    channel.send({ embeds: [embed], components: [row] });
      // === REJESTRACJA KOMENDY /urzad ===
    await client.application.commands.create({
        name: "urzad",
        description: "Otwiera panel urzędu"
    });

    console.log("Komenda /urzad została zarejestrowana!");
});

// KOMENDY TEKSTOWE
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!regulamin") {
        const embed = new EmbedBuilder()
            .setDescription(`# <:koperta:1479760548500471830> Regulamin serwera\n\nWitamy na naszym serwerze!

Kliknij przycisk poniżej i wybierz regulamin który chcesz przeczytać.

Dostępne:
• Regulamin Discord  
• Regulamin Roblox  
• Taryfikator Discord  
• Taryfikator Roblox  

Nieznajomość regulaminu nie zwalnia z jego przestrzegania.`)
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

// INTERAKCJE
client.on("interactionCreate", async (interaction) => {
    // PRZYCISKI
    if (interaction.isButton()) {
        if (interaction.customId === "start_verification") {
            const modal = new ModalBuilder()
                .setCustomId("verification_modal")
                .setTitle("Weryfikacja Roblox");

            const input = new TextInputBuilder()
                .setCustomId("roblox_nick")
                .setLabel("Twój nick Roblox")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }

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

            const row = new ActionRowBuilder().addComponents(menu);

            interaction.reply({
                content: "Wybierz co chcesz przeczytać:",
                components: [row],
                ephemeral: true
            });
        }
    }

    // MODAL WERYFIKACJI
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === "verification_modal") {
            const nick = interaction.fields.getTextInputValue("roblox_nick");
            const adminChannel = interaction.guild.channels.cache.get(ADMIN_CHANNEL_ID);

            adminChannel.send(
                `<:osoba:1479761131206611078> **Nowa weryfikacja**
Użytkownik: ${interaction.user.tag}
Nick Roblox: ${nick}`
            );

            interaction.reply({
                content: "Twój nick został wysłany do weryfikacji <:ptaszek:1479761065850962020>",
                ephemeral: true
            });
        }
    }

    // MENU REGULAMINU
    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];

        if (value === "discord") {
            interaction.reply({
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

        if (value === "taryfikator_discord") {
            interaction.reply({
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

        if (value === "roblox") {
            interaction.reply({
                content: `# <:pad:1479760675533492224> Regulamin Roblox
                
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

        if (value === "taryfikator_roblox") {
            interaction.reply({
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
});

// AUTOMATYCZNE POWITANIE NOWYCH GRACZY
const WELCOME_CHANNEL_ID = "1479172496627339417";

client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle("<:osoba:1479761131206611078> Nowy gracz na serwerze!")
        .setDescription(`Witaj ${member.user}, cieszymy się, że dołączyłeś do naszej społeczności! <:konfetti:1479760987790770288>  
Pamiętaj, aby przejść weryfikację i zapoznać się z regulaminem.`)
        .setColor("Orange")
        .setThumbnail(member.user.displayAvatarURL());

    channel.send({ embeds: [embed] });
});

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

// BOT READY
client.once("ready", async () => {
    console.log(`Bot działa jako ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    const channel = guild.channels.cache.get(VERIFY_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setDescription(
`# <:konfetti:1479760987790770288> Weryfikacja Roblox 

Kliknij przycisk znajdujący się poniżej, aby wprowadzić swój prawidłowy nick Roblox — wymagamy nazwy konta, a nie display name.  
Informacja ta jest potrzebna, abyśmy mogli poprawnie przeprowadzić proces weryfikacji i upewnić się, że podane dane są zgodne z Twoim profilem w grze.  
Prosimy o dokładne wpisanie nicku, z zachowaniem wielkości liter oraz pełnej pisowni, ponieważ wszelkie błędy mogą spowodować konieczność ponownego przejścia weryfikacji.`
    )
    .setColor("Orange");

channel.send({ embeds: [embed] });


    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("start_verification")
            .setLabel("Zweryfikuj się")
            .setStyle(ButtonStyle.Secondary)
    );

    channel.send({ embeds: [embed], components: [row] });
      // === REJESTRACJA KOMENDY /urzad ===
    await client.application.commands.create({
        name: "urzad",
        description: "Otwiera panel urzędu"
    });

    console.log("Komenda /urzad została zarejestrowana!");
});

// KOMENDY TEKSTOWE
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!regulamin") {
        const embed = new EmbedBuilder()
            .setDescription(`# <:koperta:1479760548500471830> Regulamin serwera\n\nWitamy na naszym serwerze!

Kliknij przycisk poniżej i wybierz regulamin który chcesz przeczytać.

Dostępne:
• Regulamin Discord  
• Regulamin Roblox  
• Taryfikator Discord  
• Taryfikator Roblox  

Nieznajomość regulaminu nie zwalnia z jego przestrzegania.`)
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

// INTERAKCJE
client.on("interactionCreate", async (interaction) => {
    // PRZYCISKI
    if (interaction.isButton()) {
        if (interaction.customId === "start_verification") {
            const modal = new ModalBuilder()
                .setCustomId("verification_modal")
                .setTitle("Weryfikacja Roblox");

            const input = new TextInputBuilder()
                .setCustomId("roblox_nick")
                .setLabel("Twój nick Roblox")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }

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

            const row = new ActionRowBuilder().addComponents(menu);

            interaction.reply({
                content: "Wybierz co chcesz przeczytać:",
                components: [row],
                ephemeral: true
            });
        }
    }

    // MODAL WERYFIKACJI
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === "verification_modal") {
            const nick = interaction.fields.getTextInputValue("roblox_nick");
            const adminChannel = interaction.guild.channels.cache.get(ADMIN_CHANNEL_ID);

            adminChannel.send(
                `<:osoba:1479761131206611078> **Nowa weryfikacja**
Użytkownik: ${interaction.user.tag}
Nick Roblox: ${nick}`
            );

            interaction.reply({
                content: "Twój nick został wysłany do weryfikacji <:ptaszek:1479761065850962020>",
                ephemeral: true
            });
        }
    }

    // MENU REGULAMINU
    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];

        if (value === "discord") {
            interaction.reply({
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

        if (value === "taryfikator_discord") {
            interaction.reply({
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

        if (value === "roblox") {
            interaction.reply({
                content: `# <:pad:1479760675533492224> Regulamin Roblox
                
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

        if (value === "taryfikator_roblox") {
            interaction.reply({
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
});


    channel.send({ embeds: [embed] });
});

