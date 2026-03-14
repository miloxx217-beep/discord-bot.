// ============================
// AUTOKANAŁY (TEMP VOICE)
// ============================

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

module.exports = (client, shared) => {

    const { config } = shared;

    // Mapa: userId -> { channelId, banned: Set() }
    const tempVoice = new Map();

    // ============================
    // TWORZENIE KANAŁU
    // ============================
    client.on("voiceStateUpdate", async (oldState, newState) => {
        const guild = newState.guild;
        const member = newState.member;

        // Wejście na kanał tworzenia
        if (newState.channelId === config.CREATE_VOICE_CHANNEL_ID) {

            // Jeśli już ma kanał — nic nie rób
            if (tempVoice.has(member.id)) return;

            const baseChannel = newState.channel;

            const channel = await guild.channels.create({
                name: `kanał-${member.user.username}`,
                type: 2,
                parent: baseChannel?.parentId ?? null,
                permissionOverwrites: [
                    { id: guild.id, deny: ["ViewChannel"] },
                    { id: member.id, allow: ["ViewChannel", "Connect", "Speak"] }
                ]
            });

            tempVoice.set(member.id, {
                channelId: channel.id,
                banned: new Set()
            });

            await member.voice.setChannel(channel);

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`pv_private_${member.id}`).setLabel("🔒 Prywatny").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`pv_public_${member.id}`).setLabel("🔓 Publiczny").setStyle(ButtonStyle.Secondary)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`pv_kick_${member.id}`).setLabel("👢 Wyrzuć").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`pv_ban_${member.id}`).setLabel("⛔ Zbanuj").setStyle(ButtonStyle.Secondary)
            );

            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`pv_limit_${member.id}`).setLabel("🎚 Limit osób").setStyle(ButtonStyle.Secondary)
            );

            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle("Panel zarządzania kanałem")
                        .setDescription("Tylko właściciel kanału może używać przycisków.")
                ],
                components: [row1, row2, row3]
            });
        }

        // Auto-usuwanie pustych kanałów
        if (oldState.channelId) {
            const channel = oldState.channel;
            if (!channel) return;

            const ownerEntry = [...tempVoice.entries()]
                .find(([_, data]) => data.channelId === channel.id);

            if (!ownerEntry) return;

            const [ownerId] = ownerEntry;

            if (channel.members.size === 0) {
                await channel.delete().catch(() => {});
                tempVoice.delete(ownerId);
            }
        }
    });

    // ============================
    // PRZYCISKI PANELU
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith("pv_")) return;

        const parts = interaction.customId.split("_");
        const action = parts[1];
        const ownerId = parts[2];

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: "❌ Nie jesteś właścicielem kanału.", ephemeral: true });
        }

        const data = tempVoice.get(ownerId);
        if (!data) return;

        const channel = interaction.guild.channels.cache.get(data.channelId);
        if (!channel) return;

        // PRYWATNY
        if (action === "private") {
            await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
            return interaction.reply({ content: "🔒 Kanał ustawiony na prywatny.", ephemeral: true });
        }

        // PUBLICZNY
        if (action === "public") {
            await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: true });
            return interaction.reply({ content: "🔓 Kanał ustawiony na publiczny.", ephemeral: true });
        }

        // WYRZUĆ
        if (action === "kick") {
            const members = [...channel.members.values()].filter(m => m.id !== ownerId);

            if (members.length === 0) {
                return interaction.reply({ content: "❌ Nie ma kogo wyrzucić.", ephemeral: true });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`pv_kick_select_${ownerId}`)
                .setPlaceholder("Wybierz osobę do wyrzucenia")
                .addOptions(members.map(m => ({ label: m.user.username, value: m.id })));

            return interaction.reply({
                content: "Wybierz osobę:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // BAN
        if (action === "ban") {
            const members = [...channel.members.values()].filter(m => m.id !== ownerId);

            if (members.length === 0) {
                return interaction.reply({ content: "❌ Nie ma kogo zbanować.", ephemeral: true });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`pv_ban_select_${ownerId}`)
                .setPlaceholder("Wybierz osobę do zbanowania")
                .addOptions(members.map(m => ({ label: m.user.username, value: m.id })));

            return interaction.reply({
                content: "Wybierz osobę:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // LIMIT
        if (action === "limit") {
            const modal = new ModalBuilder()
                .setCustomId(`pv_limit_modal_${ownerId}`)
                .setTitle("Ustaw limit osób");

            const input = new TextInputBuilder()
                .setCustomId("limit_value")
                .setLabel("Podaj limit (1–99)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return interaction.showModal(modal);
        }
    });

    // ============================
    // SELECT MENU — KICK / BAN
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (!interaction.customId.startsWith("pv_")) return;

        const parts = interaction.customId.split("_");
        const action = parts[1];
        const ownerId = parts[parts.length - 1];

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: "❌ Nie jesteś właścicielem kanału.", ephemeral: true });
        }

        const data = tempVoice.get(ownerId);
        if (!data) return;

        const channel = interaction.guild.channels.cache.get(data.channelId);
        if (!channel) return;

        const targetId = interaction.values[0];
        const target = channel.members.get(targetId);

        if (action === "kick") {
            if (target) await target.voice.disconnect();
            return interaction.reply({ content: `👢 Wyrzucono <@${targetId}>.`, ephemeral: true });
        }

        if (action === "ban") {
            data.banned.add(targetId);
            await channel.permissionOverwrites.edit(targetId, { Connect: false });
            if (target) await target.voice.disconnect();
            return interaction.reply({ content: `⛔ Zbanowano <@${targetId}> z tego kanału.`, ephemeral: true });
        }
    });

    // ============================
    // LIMIT — MODAL
    // ============================
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (!interaction.customId.startsWith("pv_limit_modal")) return;

        const ownerId = interaction.customId.split("_").pop();

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: "❌ Nie jesteś właścicielem kanału.", ephemeral: true });
        }

        const data = tempVoice.get(ownerId);
        if (!data) return;

        const channel = interaction.guild.channels.cache.get(data.channelId);
        if (!channel) return;

        const limit = parseInt(interaction.fields.getTextInputValue("limit_value"));

        if (isNaN(limit) || limit < 1 || limit > 99) {
            return interaction.reply({ content: "❌ Limit musi być liczbą 1–99.", ephemeral: true });
        }

        await channel.setUserLimit(limit);

        return interaction.reply({ content: `🎚 Ustawiono limit na **${limit}** osób.`, ephemeral: true });
    });
};
