module.exports = {
    bot: {
        prefix: "!",
        regex: /https?:\/\/(?:(?:www\.|m\.)?tiktok\.com\/(?:@[\w.-]+\/(?:video|photo)\/\d+|t\/[\w-]+)|(?:vm|vt)\.tiktok\.com\/[\w-]+|(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|share\/reel)\/[\w-]+|instagr\.am\/(?:p|reel)\/[\w-]+|(?:www\.|m\.)?youtube\.com\/shorts\/[\w-]+)\/?(?:[?#][^\s<>"')\]]*)?/i,
    },
    guildId: "1414414557971087504",
    playLofi: false,
    channel: {
        testimoni: "1425643330154401803",
        feedback: "1425646283154264185",
        welcome: "1425643362870104105",
        goodbye: "1425643395417903194",
        logs: "1425643464351027282",
        botLogs: "1425643829897466007",
        parent: "1425645832115327108",
        logChannel: "1485329351808651475",
        voiceChannel: "1485325790068342845",
        updateId: "1487114433779208352",
        linkLog: "1504425905899175986",
        exchangeRate: "1512274267390218332",
        exchangeID: "1512276635381137448",
    },
    role: {
        buyer: "1425643509813084210",
    },
    developer: ["1010474132753883207"],
    ticket: {
        buy: {
            customId: "buy",
            serviceCustomId: "service",
            modalTitle: "Form Ticket",
            selectPlaceholder: "Select Service To Buy",
            options: [
                {
                    label: "Bot",
                    value: "Bot",
                    description: "Select this if you want to buy Discord bot service",
                    emoji: "🤖",
                },
                {
                    label: "Server",
                    value: "Server",
                    description: "Select this if you want to buy Discord server service",
                    emoji: "🗃️",
                },
            ],
        },
        ask: {
            customId: "ask",
            serviceCustomId: "ask",
            modalTitle: "Form Ticket",
            selectPlaceholder: "Select What You Want To Ask",
            options: [
                {
                    label: "Bot",
                    value: "Bot",
                    description: "Select this if you want to ask about Discord bot",
                    emoji: "🤖",
                },
                {
                    label: "Server",
                    value: "Server",
                    description: "Select this if you want to ask about Discord server",
                    emoji: "🗃️",
                },
            ],
        },
    },
};
