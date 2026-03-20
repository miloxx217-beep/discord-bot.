const {
    Client, GatewayIntentBits, Partials,
    REST, Routes
} = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const config = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
});

// ============================
// WSPÓLNE RZECZY
// ============================

// BANK
const BANK_FILE = "bank.txt";
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

// DOWODY – LOSOWE NUMERY + kto ma dowód
let usedIDs = new Set();
let usersWithID = new Set();

if (fs.existsSync("dowody_numbers.txt")) {
    const lines = fs.readFileSync("dowody_numbers.txt", "utf8").split("\n");
    for (const line of lines) {
        if (line.trim().length > 0) usedIDs.add(line.trim());
    }
}

if (fs.existsSync("dowody_users.txt")) {
    const lines = fs.readFileSync("dowody_users.txt", "utf8").split("\n");
    for (const line of lines) {
        if (line.trim().length > 0) usersWithID.add(line.trim());
    }
}

function generateDowodNumber() {
    let number;
    do {
        number = Math.floor(100000 + Math.random() * 900000).toString();
    } while (usedIDs.has(number));

    usedIDs.add(number);
    fs.appendFileSync("dowody_numbers.txt", number + "\n");
    return number;
}

function saveUserID(userId) {
    usersWithID.add(userId);
    fs.appendFileSync("dowody_users.txt", userId + "\n");
}

// cooldown /pracuj
const workCooldown = new Map();

// REST do slashy
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// eksport wspólnych rzeczy do modułów
const shared = {
    config,
    fs,
    loadBankData,
    saveBankData,
    getUserAccount,
    setUserAccount,
    loggedInUsers,
    generateDowodNumber,
    usersWithID,
    saveUserID,
    workCooldown,
    rest
};

// ============================
// ŁADOWANIE MODUŁÓW
// ============================
require("./verify_reg_urzad.js")(client, shared);
require("./dowody.js")(client, shared);
require("./bank_kantor_sklep.js")(client, shared);
require("./autovoice.js")(client, shared);

require("./ranking.js")(client);
require("./mandaty.js")(client);
require("./resetdowod.js")(client, shared);
require("./register-commands.js");

// ============================
// OBSŁUGA KOMEND SLASH
// ============================

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const ownerRoleId = "1478754923142316276"; // ← WSTAW ID ROLI
    const workChannelId = "1479872708928864388";  

    // ============================
    // /pracuj
    // ============================
    if (interaction.commandName === "pracuj") {

        const userId = interaction.user.id;
        const now = Date.now();

        const last = shared.workCooldown.get(userId) || 0;

        if (now - last < 3600000) {
            const remaining = Math.ceil((3600000 - (now - last)) / 60000);
            return interaction.reply(`⏳ Możesz pracować ponownie za **${remaining} minut**.`);
        }

        shared.workCooldown.set(userId, now);

        const amount = Math.floor(Math.random() * (400 - 30 + 1)) + 30;

        const acc = shared.getUserAccount(userId) || { pin: "0000", balance: 0 };
        acc.balance += amount;
        shared.setUserAccount(userId, acc.pin, acc.balance);

        // Tworzymy embed
        const embed = {
            title: "💼 Praca wykonana",
            description:
                `<@${userId}> wykonał pracę.\n` +
                `Otrzymał: **${amount} $**\n` +
                `Nowe saldo: **${acc.balance} $**`,
            color: 0x00ff99,
            thumbnail: {
                url: interaction.user.displayAvatarURL({ dynamic: true })
            },
            timestamp: new Date()
        };

        const workChannel = client.channels.cache.get(workChannelId);

        // Jeśli komenda NIE została użyta na kanale #pracuj
        if (interaction.channel.id !== workChannelId) {

            if (workChannel) {
                workChannel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: `💼 Praca wykonana! Sprawdź szczegóły na kanale <#${workChannelId}>.`,
                ephemeral: true
            });
        }

        // Jeśli komenda została użyta na kanale #pracuj
        return interaction.reply({ embeds: [embed] });
    }

// ============================
// OBSŁUGA KOMEND SLASH
// ============================

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const ownerRoleId = "ID_ROLI_WŁAŚCICIELA"; // ← WSTAW ID ROLI
    const workChannelId = "ID_KANAŁU_PRACUJ";  // ← WSTAW ID KANAŁU #pracuj

    // ============================
    // /pracuj
    // ============================
    if (interaction.commandName === "pracuj") {

        const userId = interaction.user.id;
        const now = Date.now();

        const last = shared.workCooldown.get(userId) || 0;

        if (now - last < 3600000) {
            const remaining = Math.ceil((3600000 - (now - last)) / 60000);
            return interaction.reply(`⏳ Możesz pracować ponownie za **${remaining} minut**.`);
        }

        shared.workCooldown.set(userId, now);

        const amount = Math.floor(Math.random() * (400 - 30 + 1)) + 30;

        const acc = shared.getUserAccount(userId) || { pin: "0000", balance: 0 };
        acc.balance += amount;
        shared.setUserAccount(userId, acc.pin, acc.balance);

        // Tworzymy embed
        const embed = {
            title: "💼 Praca wykonana",
            description:
                `<@${userId}> wykonał pracę.\n` +
                `Otrzymał: **${amount} $**\n` +
                `Nowe saldo: **${acc.balance} $**`,
            color: 0x00ff99,
            thumbnail: {
                url: interaction.user.displayAvatarURL({ dynamic: true })
            },
            timestamp: new Date()
        };

        const workChannel = client.channels.cache.get(workChannelId);

        // Jeśli komenda NIE została użyta na kanale #pracuj
        if (interaction.channel.id !== workChannelId) {

            if (workChannel) {
                workChannel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: `💼 Praca wykonana! Sprawdź szczegóły na kanale <#${workChannelId}>.`,
                ephemeral: true
            });
        }

        // Jeśli komenda została użyta na kanale #pracuj
        return interaction.reply({ embeds: [embed] });
    }

    // ============================
    // /dodajkase
    // ============================
    if (interaction.commandName === "dodajkase") {

        if (!interaction.member.roles.cache.has(ownerRoleId)) {
            return interaction.reply("❌ Nie masz uprawnień do tej komendy.");
        }

        const user = interaction.options.getUser("uzytkownik");
        const kwota = interaction.options.getInteger("kwota");

        const acc = shared.getUserAccount(user.id) || { pin: "0000", balance: 0 };
        acc.balance += kwota;
        shared.setUserAccount(user.id, acc.pin, acc.balance);

        return interaction.reply(`💰 Dodano **${kwota}** monet użytkownikowi **${user.username}**.`);
    }
});

// ============================
// START
// ============================
client.login(process.env.TOKEN);  
  }
});
