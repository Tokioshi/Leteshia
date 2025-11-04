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
- `config.js`: (Assumed to exist, but not in the repo) Configuration file for the bot token and other settings.
- `commands/`: Contains the bot's commands. Each command is in its own file.
- `events/`: Contains the bot's events. Each event is in its own file.
- `handler/`: Contains the code for loading commands and events.
- `utils/`: Contains utility functions.
- `assets/`: Contains static assets like images.

## Getting Started

### Prerequisites

- Node.js (v16.9.0 or higher)
- npm

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
        token: 'YOUR_BOT_TOKEN',
        // other configuration options
    };
    ```
4. Start the bot:
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
