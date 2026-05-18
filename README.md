# 🌸 Leteshia Discord Bot

Leteshia is a powerful, premium, and highly extensible multi-purpose Discord bot built with **discord.js v14** and **Mongoose (MongoDB)**. It comes packed with advanced integrations like intelligent AI chatbot agents with RAG capabilities, automated social media video downloading and compression, a 24/7 Lofi music player, dynamic Canvas-drawn greeting cards, a secure personal password manager, and interactive ticket support systems.

---

## 🌟 Key Features

*   🤖 **Intelligent AI Chatbot & Dynamic RAG (Retrieval-Augmented Generation)**
    *   Powered by the advanced `llama-3.3-70b-versatile` model via the **Groq SDK**.
    *   **Automatic Multi-API Key Rotation** (handles up to 5 keys) to seamlessly rotate and prevent rate-limiting (`429`) errors.
    *   Maintains conversation memory history (stores the last 20 messages with a 20-minute expiration) directly in **MongoDB**.
    *   **Dynamic Learning / RAG**: Administrators can teach the AI dynamically by crawling and summarizing channel histories (`!knowledge`) or feeding in custom facts manually (`!knowledge-add`).
*   📹 **Automated Social Media Video Downloader & Compressor**
    *   Automatically scans text messages for **TikTok** and **Instagram (Reels/Posts)** links.
    *   Downloads video streams, detects file sizes, and **automatically compresses** large videos (>10MB limit) using **FFmpeg** before uploading.
    *   Automatically cleans up temporary system storage and logs social media downloads to a custom link logs channel.
*   🎫 **Interactive Ticket & Support System**
    *   Interactive support panel featuring stylish Discord buttons, select menus, and modal dialog forms (`Form Ticket`).
    *   Streamlines customer acquisition and service queries (e.g., buying a Discord bot, purchasing a server, or general Q&A).
    *   Tracks ticket creators and details persistently using MongoDB.
*   🎨 **Real-Time Dynamic Welcome & Goodbye Cards (Canvas)**
    *   Programmatically draws stunning, custom-styled graphic cards (`welcome.png`) for newly joined members using the **Canvas API**.
    *   Features elegant glassmorphism, avatar shadows, linear gradients, custom *Metropolis* typography, and randomly generated stars/sparkles decoration.
*   🎵 **24/7 Lofi Music Player**
    *   Stays connected to your designated voice channel to play a relaxing, uninterrupted stream of Lofi music.
*   🔑 **Secure Ephemeral Password Manager**
    *   Private password safe using the `/password` slash commands, securely stored in MongoDB database collections.
    *   All queries and lists are served as *ephemeral* responses (only visible to you) for maximum privacy.
    *   Includes dynamic pagination buttons (Previous/Next) to browse through saved credentials easily.
*   🛡️ **Utility, Logging & Message Sniping**
    *   `!snipe` command with index support to easily recover and read deleted text messages and attachments in the current channel.
    *   Comprehensive logging for deleted messages and guild member status.

---

## 🛠️ Prerequisites

Before you start setting up the bot, ensure you have the following installed on your host server:

1.  **Node.js** (v16.9.0 or higher)
2.  **npm** (Node Package Manager)
3.  **MongoDB Database** (A local MongoDB instance or a free cloud-based [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)
4.  **FFmpeg** (Crucial! Required by the automated video compression module to process heavy downloads)
    *   **Windows**: Download from [FFmpeg Official](https://ffmpeg.org/download.html) and add the binary paths to your system's Environment Variables (`PATH`).
    *   **Ubuntu/Debian**: Run `sudo apt update && sudo apt install ffmpeg`
    *   **macOS**: Run `brew install ffmpeg`

---

## 🚀 Installation & Configuration

### 1. Clone the Repository
```bash
git clone https://github.com/Tokioshi/Leteshia.git
cd Leteshia
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (`.env`)
Create a `.env` file in the root directory and add the following keys:
```env
CLIENT_TOKEN="YOUR_DISCORD_BOT_TOKEN"

# Provide up to 5 Groq API Keys for automatic rotation to bypass rate limits
GROQ_API_KEY_1="YOUR_GROQ_API_KEY_1"
GROQ_API_KEY_2="YOUR_GROQ_API_KEY_2"
GROQ_API_KEY_3="YOUR_GROQ_API_KEY_3"
GROQ_API_KEY_4="YOUR_GROQ_API_KEY_4"
GROQ_API_KEY_5="YOUR_GROQ_API_KEY_5"

# MongoDB connection URI
MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority"
```

### 4. Adjust Application Configurations (`config.js`)
Open the pre-configured [config.js](C:\Users\Tiko\Documents\Leteshia\config.js) file and replace the mock/existing Snowflakes with your own Discord IDs:
*   `guildId`: Your main server/guild ID.
*   `developer`: Array of Discord User IDs allowed to perform administrative tasks (e.g. reload commands).
*   `channel`: Specify target channels for features like testimonies, feedbacks, welcomes, goodbyes, bot logs, voice channel lofi, link logging, etc.
*   `ticket`: Define interactive modal properties, form titles, and select options for the ticket system.

---

## 🎮 Command Reference

### Prefix Commands (Prefix: `!`)
| Command | Arguments | Description | Permission |
| :--- | :--- | :--- | :--- |
| `!ai` | `<prompt>` | Initiates a chat conversation with the AI | Everyone |
| `!reset` | - | Clears your personal active conversation history | Everyone |
| `!snipe` | `[index]` | Snippes and displays recently deleted messages or attachments | Everyone |
| `!knowledge` | - | Instructs the bot to harvest and memorize information from the current channel | Admin Only |
| `!knowledge-add`| `<text>` | Manually feeds a key fact or rule to the bot's RAG system | Admin Only |
| `!knowledge-show`| - | Displays all currently saved manual and channel knowledge | Admin Only |
| `!knowledge-clear`| - | Wipes the entire RAG knowledge base for this server | Admin Only |

### Application Slash Commands (Prefix: `/`)
| Slash Command | Subcommands / Options | Description |
| :--- | :--- | :--- |
| `/password` | `add`, `find`, `remove`, `list` | Add, retrieve, delete, or list your private password entries securely (ephemeral) |
| `/lofi` | `play <song>`, `skip` | Connect the bot to voice and control the background Lofi playlist |
| `/avatar` | `[user]` | Displays the high-resolution avatar image of a user |
| `/feedback` | `<text>` | Sends feedback or suggestions to the developers' feedback channel |
| `/testimoni` | `<text>` | Submits testimonials or reviews to the testimonial channel |
| `/panel` | - | Deploys the interactive Service Purchase / Q&A Support Ticket Panel |
| `/serverinfo` | - | Displays comprehensive information and statistics about the server |
| `/userinfo` | `[user]` | Fetches detailed profile statistics of a user |
| `/specification` | - | Shows technical host specs and bot system resources |
| `/ping` | - | Displays client and API connection latencies |
| `/reload` | - | Reloads all application commands instantly without restarting the process |

---

## 🖥️ Running the Application

### Production Mode
```bash
npm start
```

### Development Mode (with hot-reloading)
```bash
npm run dev
```

---

## 📄 License

This project is licensed under the **ISC License**. See the `LICENSE` file for more details.
