const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// XP System Constants
const COOLDOWN_TIME = 30 * 1000;
const MIN_XP_GAIN = 15;
const MAX_XP_GAIN = 25;

// Cooldowns Map - shared across all functions
const cooldowns = new Map();

function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100));
}

function xpForNextLevel(level) {
    return Math.pow(level + 1, 2) * 100;
}

async function handleXPGain(message) {
    // Early return if message is from a bot or not in a guild
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}_${userId}`;

    // Check cooldown
    const now = Date.now();
    const lastActivity = cooldowns.get(key);
    if (lastActivity && now - lastActivity < COOLDOWN_TIME) {
        return;
    }

    cooldowns.set(key, now);

    try {
        const userXP = (await db.get(`xp_${key}`)) || 0;
        const currentLevel = calculateLevel(userXP);

        const xpToAdd =
            Math.floor(Math.random() * (MAX_XP_GAIN - MIN_XP_GAIN + 1)) + MIN_XP_GAIN;
        const newXP = userXP + xpToAdd;

        await db.set(`xp_${key}`, newXP);

        const newLevel = calculateLevel(newXP);

        if (newLevel > currentLevel) {
            await sendLevelUpMessage(message, newLevel, newXP);
        }
    } catch (error) {
        console.error(
            `Error handling XP gain for user ${userId} in guild ${guildId}: `,
            error
        );
    }
}

async function sendLevelUpMessage(message, newLevel, totalXP) {
    try {
        const levelChannel = message.client.channels.cache.get(
            message.client.config.channel.level
        );

        if (!levelChannel) {
            console.warn(
                `Level up channel not found for guild ${message.guild.id}`
            );
            return;
        }

        const xpNeededForNext = xpForNextLevel(newLevel);
        const xpUntilNext = Math.max(0, xpNeededForNext - totalXP);

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("🎉 Level Up!")
            .setDescription(
                `${message.author} telah naik ke **Level ${newLevel}**!`
            )
            .addFields(
                {
                    name: "Total XP",
                    value: totalXP.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Next Level",
                    value:
                        xpUntilNext > 0
                            ? `${xpUntilNext.toLocaleString()} XP lagi`
                            : "Max Level!",
                    inline: true,
                }
            )
            .setThumbnail(
                message.author.displayAvatarURL({
                    forceStatic: true,
                })
            )
            .setTimestamp();

        await levelChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Error sending level up message:`, error);
    }
}

function cleanupOldCooldowns() {
    const now = Date.now();
    for (const [key, timestamp] of cooldowns.entries()) {
        if (now - timestamp > COOLDOWN_TIME * 2) {
            cooldowns.delete(key);
        }
    }
}

// Optional: Get user XP data (useful for commands)
async function getUserXP(userId, guildId) {
    const key = `${guildId}_${userId}`;
    const userXP = (await db.get(`xp_${key}`)) || 0;
    const currentLevel = calculateLevel(userXP);
    const xpNeededForNext = xpForNextLevel(currentLevel);
    const xpUntilNext = Math.max(0, xpNeededForNext - userXP);

    return {
        xp: userXP,
        level: currentLevel,
        xpForNext: xpNeededForNext,
        xpUntilNext: xpUntilNext
    };
}

// Optional: Set user XP (useful for admin commands)
async function setUserXP(userId, guildId, xp) {
    const key = `${guildId}_${userId}`;
    await db.set(`xp_${key}`, Math.max(0, xp));
}

// Optional: Add XP to user (useful for bonus XP commands)
async function addUserXP(userId, guildId, xpToAdd) {
    const key = `${guildId}_${userId}`;
    const currentXP = (await db.get(`xp_${key}`)) || 0;
    const newXP = currentXP + xpToAdd;
    await db.set(`xp_${key}`, Math.max(0, newXP));
    return newXP;
}

module.exports = {
    // Original functions
    capital,
    calculateLevel,
    xpForNextLevel,
    
    // XP System functions
    handleXPGain,
    sendLevelUpMessage,
    cleanupOldCooldowns,
    getUserXP,
    setUserXP,
    addUserXP,
};