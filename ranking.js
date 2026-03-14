module.exports = (client) => {

    const fs = require("fs");
    const { EmbedBuilder } = require("discord.js");

    const BANK_FILE = "bank.txt"; // ten sam plik co w bot.js
    const RANKING_CHANNEL_ID = "1480273368891658370";

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

    async function sendRanking() {
        const channel = client.channels.cache.get(RANKING_CHANNEL_ID);
        if (!channel) return;

        const data = loadBankData();
        const entries = Object.entries(data)
            .sort((a, b) => b[1].balance - a[1].balance)
            .slice(0, 20);

        let text = "";
        let place = 1;

        for (const [userId, info] of entries) {
            text += `**${place}.** <@${userId}> — **${info.balance}$**\n`;
            place++;
        }

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle("🏦 Ranking najbogatszych graczy")
            .setDescription(text || "Brak danych.")
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    // co 5 minut
    setInterval(sendRanking, 5 * 60 * 1000);

    // komenda do ręcznego wysłania
    client.on("messageCreate", async (msg) => {
        if (msg.content === "!ranking") {
            sendRanking();
            msg.reply("Ranking został wysłany.");
        }
    });
};
