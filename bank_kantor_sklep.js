// ============================
// BANK + KANTOR + SKLEP
// ============================

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    InteractionType
} = require("discord.js");

module.exports = (client, shared) => {

    const {
        config,
        loadBankData,
        saveBankData,
        getUserAccount,
        setUserAccount,
        loggedInUsers
    } = shared;

    // ============================
    // READY — wysyłanie paneli
    // ============================
    client.once("ready", async () => {
        const guild = client.guilds.cache.get(config.GUILD_ID);
        if (!guild) return;

        // BANK PANEL
        const bankChannel = guild.channels.cache.get(config.BANK_CHANNEL_ID);
        if (bankChannel) {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# <:mlot:1479760749541855362> Bank

Witamy w oficjalnym systemie bankowym serwera.
Bank Centralny zapewnia bezpieczne przechowywanie środków oraz szybkie i wygodne operacje finansowe dla wszystkich mieszkańców miasta.

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

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_login")
                    .setLabel("Zaloguj się")
                    .setStyle(ButtonStyle.Secondary)
            );

            await bankChannel.send({ embeds: [embed], components: [row] });
        }

        // KANTOR PANEL
        const kantorChannel = guild.channels.cache.get(config.KANTOR_CHANNEL_ID);
        if (kantorChannel) {
            const embed = new EmbedBuilder()
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

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("kantor_wymiana")
                    .setLabel("Wymień walutę")
                    .setStyle(ButtonStyle.Secondary)
            );

            await kantorChannel.send({ embeds: [embed], components: [row] });
        }

        // SKLEP PANEL
        const sklepChannel = guild.channels.cache.get(config.SKLEP_CHANNEL_ID);
        if (sklepChannel) {
            const embed = new EmbedBuilder()
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

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("sklep_open")
                    .setLabel("Otwórz sklep")
                    .setStyle(ButtonStyle.Secondary)
            );

            await sklepChannel.send({ embeds: [embed], components: [row] });
        }
    });

    // ============================
    // PRZYCISKI
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        // ----------------------------
        // BANK LOGIN
        // ----------------------------
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
            }

            const modal = new ModalBuilder()
                .setCustomId("bank_login_modal")
                .setTitle("Logowanie do banku");

            const pinInput = new TextInputBuilder()
                .setCustomId("bank_pin_login")
                .setLabel("Podaj swój PIN")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(pinInput));
            return interaction.showModal(modal);
        }

        // ----------------------------
        // BANK MENU
        // ----------------------------
        if (interaction.customId === "bank_menu") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany.",
                    ephemeral: true
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_saldo")
                    .setLabel("Saldo")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("bank_przelew")
                    .setLabel("Przelew")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "Wybierz operację:",
                components: [row],
                ephemeral: true
            });
        }

        // ----------------------------
        // BANK SALDO
        // ----------------------------
        if (interaction.customId === "bank_saldo") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany.",
                    ephemeral: true
                });
            }

            const account = getUserAccount(interaction.user.id);

            return interaction.reply({
                content: `💰 Twoje saldo: **${account.balance} $**`,
                ephemeral: true
            });
        }

        // ----------------------------
        // BANK PRZELEW — MODAL
        // ----------------------------
        if (interaction.customId === "bank_przelew") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany.",
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("bank_transfer_modal")
                .setTitle("Przelew bankowy");

            const target = new TextInputBuilder()
                .setCustomId("bank_transfer_target")
                .setLabel("Podaj @użytkownika lub ID")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const amount = new TextInputBuilder()
                .setCustomId("bank_transfer_amount")
                .setLabel("Kwota")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(target),
                new ActionRowBuilder().addComponents(amount)
            );

            return interaction.showModal(modal);
        }

        // ----------------------------
        // KANTOR — OTWARCIE TICKETA
        // ----------------------------
        if (interaction.customId === "kantor_wymiana") {

            const ticket = await interaction.guild.channels.create({
                name: `kantor-${interaction.user.username}`,
                type: 0,
                parent: config.KANTOR_TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                    { id: interaction.guild.ownerId, allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(
`# Kantor — wymiana waluty

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
                    .setLabel("Zrealizuj")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("kantor_zamknij")
                    .setLabel("Zamknij")
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });

            return interaction.reply({
                content: "Ticket kantoru został utworzony!",
                ephemeral: true
            });
        }

        // ----------------------------
        // KANTOR — ZAMKNIĘCIE
        // ----------------------------
        if (interaction.customId === "kantor_zamknij") {
            if (!interaction.member.roles.cache.has(config.WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            return interaction.channel.delete();
        }

        // ----------------------------
        // SKLEP — OTWARCIE
        // ----------------------------
        if (interaction.customId === "sklep_open") {
            const menu = new StringSelectMenuBuilder()
                .setCustomId("sklep_select")
                .setPlaceholder("Wybierz produkt")
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
                content: "Wybierz przedmiot:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }
    });

    // ============================
    // MODALE
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (interaction.type !== InteractionType.ModalSubmit) return;

        // ----------------------------
        // BANK — TWORZENIE KONTA
        // ----------------------------
        if (interaction.customId === "bank_create_modal") {
            const pin = interaction.fields.getTextInputValue("bank_pin").trim();

            if (!/^\d{4}$/.test(pin)) {
                return interaction.reply({
                    content: "❌ PIN musi mieć 4 cyfry.",
                    ephemeral: true
                });
            }

            const existing = getUserAccount(interaction.user.id);
            if (existing) {
                return interaction.reply({
                    content: "❌ Masz już konto.",
                    ephemeral: true
                });
            }

            setUserAccount(interaction.user.id, pin, 0);
            loggedInUsers.add(interaction.user.id);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_menu")
                    .setLabel("Menu banku")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "✔ Konto utworzone!",
                components: [row],
                ephemeral: true
            });
        }

        // ----------------------------
        // BANK — LOGOWANIE
        // ----------------------------
        if (interaction.customId === "bank_login_modal") {
            const pin = interaction.fields.getTextInputValue("bank_pin_login").trim();
            const account = getUserAccount(interaction.user.id);

            if (!account) {
                return interaction.reply({
                    content: "❌ Nie masz konta.",
                    ephemeral: true
                });
            }

            if (account.pin !== pin) {
                return interaction.reply({
                    content: "❌ Zły PIN.",
                    ephemeral: true
                });
            }

            loggedInUsers.add(interaction.user.id);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bank_menu")
                    .setLabel("Menu banku")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "✔ Zalogowano!",
                components: [row],
                ephemeral: true
            });
        }

        // ----------------------------
        // BANK — PRZELEW
        // ----------------------------
        if (interaction.customId === "bank_transfer_modal") {
            if (!loggedInUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ Nie jesteś zalogowany.",
                    ephemeral: true
                });
            }

            const targetRaw = interaction.fields.getTextInputValue("bank_transfer_target").trim();
            const amountRaw = interaction.fields.getTextInputValue("bank_transfer_amount").trim();

            const amount = Number(amountRaw);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({
                    content: "❌ Kwota musi być dodatnia.",
                    ephemeral: true
                });
            }

            let targetId = targetRaw;
            const match = targetRaw.match(/^<@!?(\d+)>$/);
            if (match) targetId = match[1];

            if (targetId === interaction.user.id) {
                return interaction.reply({
                    content: "❌ Nie możesz przelać samemu sobie.",
                    ephemeral: true
                });
            }

            const senderAcc = getUserAccount(interaction.user.id);
            if (!senderAcc || senderAcc.balance < amount) {
                return interaction.reply({
                    content: "❌ Brak środków.",
                    ephemeral: true
                });
            }

            const targetAcc = getUserAccount(targetId);
            if (!targetAcc) {
                return interaction.reply({
                    content: "❌ Odbiorca nie ma konta.",
                    ephemeral: true
                });
            }

            const data = loadBankData();
            data[interaction.user.id].balance -= amount;
            data[targetId].balance += amount;
            saveBankData(data);

            return interaction.reply({
                content: `✔ Przelano ${amount}$ do <@${targetId}>.`,
                ephemeral: true
            });
        }

        // ----------------------------
        // KANTOR — REALIZACJA
        // ----------------------------
        if (interaction.customId === "kantor_modal") {
            if (!interaction.member.roles.cache.has(config.WLASCICIEL_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Brak uprawnień.",
                    ephemeral: true
                });
            }

            const userId = interaction.fields.getTextInputValue("kantor_id");
            const kwotaRaw = interaction.fields.getTextInputValue("kantor_kwota");
            const kwota = Number(kwotaRaw);

            if (isNaN(kwota) || kwota <= 0) {
                return interaction.reply({
                    content: "❌ Kwota musi być dodatnia.",
                    ephemeral: true
                });
            }

            const account = getUserAccount(userId);
            if (!account) {
                return interaction.reply({
                    content: "❌ Ten użytkownik nie ma konta.",
                    ephemeral: true
                });
            }

            const data = loadBankData();
            data[userId].balance += kwota;
            saveBankData(data);

            await interaction.channel.send(
                `Realizacja kantoru — <@${userId}> otrzymał ${kwota}$.`
            );

            return interaction.reply({
                content: "✔ Zrealizowano kantor.",
                ephemeral: true
            });
        }
    });

    // ============================
    // SELECT MENU — SKLEP
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== "sklep_select") return;

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
            "premium_8000": config.PREMIUM_ROLE_ID,
            "pj_B_3500": config.PJ_B_ROLE_ID,
            "pj_A_3000": config.PJ_A_ROLE_ID,
            "pj_T_2000": config.PJ_T_ROLE_ID,
            "pj_C_4000": config.PJ_C_ROLE_ID,
            "pj_D_4500": config.PJ_D_ROLE_ID,
            "pj_CE_5000": config.PJ_CE_ROLE_ID
        };

        const price = prices[choice];
        const name = names[choice];
        const roleId = roles[choice];

        if (account.balance < price) {
            return interaction.reply({
                content: `❌ Brakuje Ci środków. Potrzebujesz ${price}$.`,
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
            content: `✔ Zakupiono: **${name}** za **${price}$**.`,
            ephemeral: true
        });
    });
};
