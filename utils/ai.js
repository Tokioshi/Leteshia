const Groq = require("groq-sdk");
const AISession = require("../models/AISession");
const Knowledge = require("../models/Knowledge");

const API_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
].filter(Boolean);

if (API_KEYS.length === 0) throw new Error("No GROQ API keys configured.");

const MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY = 20;
const HISTORY_TTL_MS = 20 * 60 * 1000;

let currentKeyIndex = 0;
const groqClients = new Map();
function getGroqClient() {
    const key = API_KEYS[currentKeyIndex];
    if (!groqClients.has(key)) {
        groqClients.set(key, new Groq({ apiKey: key }));
    }
    return groqClients.get(key);
}

function isRateLimitError(e) {
    return e?.status === 429 || e?.constructor?.name === "RateLimitError";
}

async function buildSystemPrompt(guildId) {
    try {
        const knowledge = await Knowledge.findOne({ guildId });
        const manual = knowledge?.manual || [];
        const channels = knowledge?.channels || [];

        let system = `You are a helpful Discord assistant. Always reply in the language the user writes in.

## Response Style
Respond naturally, like a knowledgeable person explaining something — not like a template filler.
- Start with a brief, direct explanation or answer in plain prose.
- Only use a list or bullet points if the content genuinely benefits from it (multiple options, steps, comparisons). Do not force structure where prose is clearer.
- Use Discord markdown: **bold**, *italic*, \`inline code\`, and \`\`\`code blocks\`\`\` where appropriate.
- Headers (###) are allowed for clearly distinct sections when needed.

## Formatting Restrictions
- NEVER use Markdown tables. No "|" characters, no "---" separators.
- If listing items, prefer bullet points or numbered lists over bolded key-value pairs unless the key genuinely adds clarity.

## Content Rules
- Manual knowledge is authoritative. Channel knowledge is supplementary context only.
- Do not respond to dangerous or harmful prompts.`;

        if (manual.length) {
            system += "\n\n## Manual Knowledge\n";
            manual.forEach((e, i) => {
                system += `${i + 1}. ${e.text}\n`;
            });
        }

        if (channels.length) {
            system += "\n\n## Channel Knowledge\n";
            channels.forEach((e) => {
                system += `#${e.channelName}:\n${e.summary}\n`;
            });
        }

        return system;
    } catch (error) {
        console.error("[AI] Failed to build system prompt:", error);
        return "You are a helpful Discord assistant.";
    }
}

async function askAI(guildId, userId, input) {
    try {
        const systemPrompt = await buildSystemPrompt(guildId);

        const session = await AISession.findOne({ guildId, userId });

        const now = Date.now();
        const isExpired = !session?.lastTimestamp || now - session.lastTimestamp > HISTORY_TTL_MS;
        const history = isExpired ? [] : session?.history || [];

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((h) => ({ role: h.role, content: h.text })),
            { role: "user", content: input },
        ];

        let attempts = 0;

        while (attempts < API_KEYS.length) {
            try {
                const groq = getGroqClient();
                const completion = await groq.chat.completions.create({
                    model: MODEL,
                    max_tokens: 1024,
                    messages,
                });

                const reply = completion.choices[0].message.content;

                const newHistory = [
                    ...history,
                    { role: "user", text: input },
                    { role: "assistant", text: reply },
                ].slice(-MAX_HISTORY);

                await AISession.findOneAndUpdate(
                    { guildId, userId },
                    { history: newHistory, lastTimestamp: now },
                    { upsert: true, returnDocument: "after" },
                );

                return reply;
            } catch (e) {
                if (isRateLimitError(e)) {
                    console.warn(`Key index ${currentKeyIndex} hit rate limit. Rotating...`);
                    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
                    attempts++;
                } else {
                    throw e;
                }
            }
        }

        throw new Error("ALL_KEYS_RATE_LIMITED");
    } catch (error) {
        if (error.message === "ALL_KEYS_RATE_LIMITED") throw error;
        console.error("[AI] askAI error:", error);
        throw error;
    }
}

module.exports = { askAI, MODEL, getGroqClient };
