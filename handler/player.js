const { GatewayDispatchEvents, EmbedBuilder } = require("discord.js");
const { Riffy } = require("riffy");
const chalk = require("chalk");
const backupStates = new Map();

module.exports = (client) => {
    const nodes = [
        {
	    name: client.config.lavalink.name,
            host: client.config.lavalink.host,
            password: client.config.lavalink.password,
            port: client.config.lavalink.port,
            secure: client.config.lavalink.secure,
            reconnectTimeout: 5000,
            reconnectTries: Infinity,
        },
    ];

    client.loopStates = new Map();

    client.riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",
    });

    client.on("clientReady", () => {
        client.riffy.init(client.user.id);
    });

    client.on("raw", (d) => {
        if (
            ![
                GatewayDispatchEvents.VoiceStateUpdate,
                GatewayDispatchEvents.VoiceServerUpdate,
            ].includes(d.t)
        )
            return;
        client.riffy.updateVoiceState(d);
    });

    client.riffy.on("nodeConnect", (node) => {
        console.log(
            chalk.greenBright("[NODE]"),
            chalk.white(`Node "${node.name}" connected ✅`)
        );

        for (const [guildId, state] of backupStates.entries()) {
            const player = client.riffy.createConnection({
                guildId,
                voiceChannel: state.track.voiceChannel,
                textChannel: state.track.textChannel,
                selfDeaf: true,
            });

            if (state.track) {
                player.play(state.track);
            }

            for (const track of state.queue) {
                player.queue.add(track);
            }

            if (state.loop) player.setLoop(state.loop);
        }
    });

    client.riffy.on("nodeError", (node, error) => {
        console.error(
            chalk.red("[ERROR]"),
            chalk.white(`Node "${node.name}" error: ${error.message} ❌`)
        );

        setTimeout(() => node.connect(), 5000);
    });

    client.riffy.on("nodeDisconnect", (node, reason) => {
        console.warn(
            chalk.yellow("[NODE]"),
            chalk.white(
                `Node ${node.name} disconnected: ${JSON.stringify(reason)}`
            )
        );

        for (const player of node.players.values()) {
            backupStates.set(player.guildId, {
                track: player.current,
                queue: player.queue,
                loop: player.loop,
            });
        }

        setTimeout(() => {
            console.log(
                chalk.yellow("[NODE]"),
                chalk.white(`Reconnecting to ${node.name}...`)
            );
            node.connect();
        }, 5000);
    });

    client.riffy.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (!channel) return;

        const looped = client.loopStates.get(player.guildId) || false;
        if (
            !looped ||
            !player.current ||
            player.current.info.identifier !== track.info.identifier
        ) {
            const embed = new EmbedBuilder()
                .setTitle("🎶 Now Playing")
                .setDescription(
                    `**${track.info.title}**\nBy: ${track.info.author}`
                )
                .addFields(
                    {
                        name: "Requested By",
                        value: `${track.info.requester}`,
                        inline: true,
                    },
                    {
                        name: "Loop",
                        value: looped ? "🔄 Enabled" : "⏹ Disabled",
                        inline: true,
                    }
                )
                .setColor(0x00ae86)
                .setThumbnail(track.info.artworkUrl || null);
            await channel.send({ embeds: [embed] });
        }
    });

    client.riffy.on("queueEnd", async (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (!channel) return;

        client.loopStates.delete(player.guildId);

        const embed = new EmbedBuilder()
            .setTitle("✅ Queue Ended")
            .setDescription("Add more songs with `/play`!")
            .setColor(0xff6b6b);

        await channel.send({ embeds: [embed] });
        player.destroy();
    });
};
