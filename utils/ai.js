const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core");
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

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const MODEL = "openai/gpt-oss-120b";
const MAX_HISTORY = 10;
const HISTORY_TTL_MS = 20 * 60 * 1000;
const PROMPT_CACHE_TTL_MS = 5 * 60 * 1000;

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

const promptCache = new Map();

function invalidatePromptCache(guildId) {
    promptCache.delete(guildId);
}

async function buildSystemPrompt(guildId) {
    const now = Date.now();
    const cached = promptCache.get(guildId);
    if (cached && now < cached.expiresAt) {
        return cached.prompt;
    }

    try {
        const knowledge = await Knowledge.findOne({ guildId });
        const manual = knowledge?.manual || [];
        const channels = knowledge?.channels || [];

        let system = `You are a helpful Discord assistant. Always reply in the language the user writes in.

## Response Style & Formatting Rules
Respond naturally, like a knowledgeable person explaining something in a chat — not like a rigid textbook or template filler.

1. TEXT STRUCTURE
- Start with a brief, direct explanation or answer in plain, conversational prose.
- Only use a list or bullet points if the content genuinely benefits from it (multiple options, steps, comparisons).
- Do not force structure where prose is clearer. Keep explanations organic.

2. DISCORD COMPATIBILITY (STRICT)
- You must ONLY use these Discord markdown features: **bold**, *italic*, \`inline code\`, and \`\`\`code block\`\`\`.
- Headers are ONLY allowed using "### " (triple hash) for clearly distinct sections. Never use "# " or "## ".
- ABSOLUTELY FORBIDDEN: Never generate Markdown tables using pipe bars (|) and hyphens (-). If data needs comparison, write it as plain text paragraphs or a simple bulleted list.
- ABSOLUTELY FORBIDDEN: Never use horizontal rule lines (---).

## Formatting Restrictions
- NEVER use Markdown tables. No "|" characters, no "---" separators.
- If listing items, prefer bullet points or numbered lists over bolded key-value pairs unless the key genuinely adds clarity.

## Content Rules
- Manual knowledge is authoritative. Channel knowledge is supplementary context only.
- Web Search Data is provided for real-time internet questions. Treat it as factual and up-to-date context.
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

        promptCache.set(guildId, { prompt: system, expiresAt: now + PROMPT_CACHE_TTL_MS });
        return system;
    } catch (error) {
        console.error("[AI] Failed to build system prompt:", error);
        return "You are a helpful Discord assistant.";
    }
}

async function checkSearchRequirement(input) {
    try {
        const groq = getGroqClient();
        const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            max_tokens: 5,
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a routing agent. Determine if the user's prompt asks about real-time, current events, recent data, weather, scores, or news that requires live internet access. Respond with exactly 'YES' or 'NO'. No other words.",
                },
                {
                    role: "user",
                    content: input,
                },
            ],
        });

        const decision = response.choices[0].message.content.trim().toUpperCase();
        return decision.includes("YES");
    } catch (error) {
        console.error("[Router Error]", error);
        return true;
    }
}

async function searchWeb(query) {
    try {
        const response = await tvly.search(query, {
            searchDepth: "basic",
            includeAnswer: true,
            maxResults: 3,
        });

        if (response && response.answer) {
            return response.answer;
        }

        if (response && response.results && response.results.length > 0) {
            return response.results
                .map((result) => `- ${result.title}: ${result.content}`)
                .join("\n");
        }

        return null;
    } catch (error) {
        console.error("[Tavily] Search failed:", error);
        return null;
    }
}

async function askAI(guildId, userId, input) {
    try {
        const systemPrompt = await buildSystemPrompt(guildId);

        let webContext = null;
        const needsWebSearch = await checkSearchRequirement(input);

        if (needsWebSearch) {
            webContext = await searchWeb(input);
        }

        const session = await AISession.findOne({ guildId, userId });
        const now = Date.now();
        const isExpired = !session?.lastTimestamp || now - session.lastTimestamp > HISTORY_TTL_MS;
        const history = isExpired ? [] : session?.history || [];

        let finalInput = input;
        if (webContext) {
            finalInput = `Information from the internet:\n"""\n${webContext}\n"""\n\nStrict Rules for Assistant:\n- Answer the User Question using ONLY the factual data provided in the internet context above.\n- If the specific detail is not mentioned, state clearly that the information is unavailable. DO NOT make up numbers or stats.\n\nUser Question: ${input}`;
        }

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((h) => ({ role: h.role, content: h.text })),
            { role: "user", content: finalInput },
        ];

        let attempts = 0;

        while (attempts < API_KEYS.length) {
            try {
                const groq = getGroqClient();
                const completion = await groq.chat.completions.create({
                    model: MODEL,
                    max_tokens: 2048,
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

module.exports = { askAI, MODEL, getGroqClient, invalidatePromptCache };
