# Leteshia Bot Discord

A Discord bot built with discord.js.

## Description

This is a multi-purpose Discord bot with a variety of features. It's designed to be easily extensible with new commands and events.

## Features

- Command handling
- Event handling

## Project Structure

The project is structured as follows:

- `index.js`: The main entry point for the bot.
- `config.js`: onfiguration file for client settings.
- `commands/`: Contains the bot's commands. Each command is in its own file.
- `events/`: Contains the bot's events. Each event is in its own file.
- `handler/`: Contains the code for loading commands and events.
- `utils/`: Contains utility functions.
- `assets/`: Contains static assets like images.

## Getting Started

### Prerequisites

- Node.js (v16.9.0 or higher)
- npm
- Brain to use

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Tokioshi/Leteshia.git
    ```
2. Install the dependencies:
    ```bash
    npm install
    ```
3. Create a `config.js` file in the root directory and add the following:
    ```javascript
    module.exports = {
        guildId: "GUILD_ID",
        channel: {
            testimoni: "CHANNEL_ID",
            feedback: "CHANNEL_ID",
            welcome: "CHANNEL_ID",
            goodbye: "CHANNEL_ID",
            logs: "CHANNEL_ID",
            botLogs: "CHANNEL_ID",
            parent: "CHANNEL_ID",
            logChannel: "CHANNEL_ID",
            voiceChannel: "CHANNEL_ID",
            updateId: "CHANNEL_ID",
            linkLog: "CHANNEL_ID",
        },
        role: {
            buyer: "ROLE_ID",
        },
        developer: ["YOUR_ID"],
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
    ```
4. Create a `.env` file in the root directory and add the following:

    ```json
    GROQ_API_KEY_1="API_TOKEN_1"
    GROQ_API_KEY_2="API_TOKEN_2"
    GROQ_API_KEY_3="API_TOKEN_3"
    GROQ_API_KEY_4="API_TOKEN_4"
    GROQ_API_KEY_5="API_TOKEN_5"

    CLIENT_TOKEN="BOT_TOKEN"
    ```

5. Start the bot:
    ```bash
    npm start
    ```

### Development

To run the bot in development mode with nodemon, use:

```bash
npm run dev
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the ISC License.
