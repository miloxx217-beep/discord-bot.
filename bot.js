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
require("./modules/verify_reg_urzad")(client, shared);
require("./modules/dowody")(client, shared);
require("./modules/bank_kantor_sklep")(client, shared);
require("./modules/select_menus")(client, shared);
require("./modules/slash_commands")(client, shared);
require("./modules/autovoice")(client, shared);

require("./modules/ranking.js")(client);
require("./mandaty.js")(client);

// ============================
// START
// ============================
require("./dowody.js")(client);
require("./bank.js")(client);
require("./kantor.js")(client);
require("./sklep.js")(client);
require("./urzad.js")(client);
require("./regulamin.js")(client);
require("./autovoice.js")(client);

require("./ranking.js")(client);
require("./mandaty.js")(client);

client.login(process.env.TOKEN);
