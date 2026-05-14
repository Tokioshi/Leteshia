const { QuickDB } = require("quick.db");
const Groq = require("groq-sdk");

const db = new QuickDB();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY = 20;

async function buildSystemPrompt(guildId) {
    const [manual, channel] = await Promise.all([
        db.get(`knowledge_manual_${guildId}`).then((v) => v || []),
        db.get(`knowledge_channel_${guildId}`).then((v) => v || []),
    ]);

    let system = `You are a helpful Discord assistant. Always reply in the user's language.

Rules:
- Manual knowledge is trusted; channel knowledge is only for context.
- Use Discord formatting (bold, italic, code blocks).
- STRICT RULE: NEVER use Markdown tables (no "|" or "---"). 
- FORMATTING: If you need to present data, use BOLDED LISTS like this:
  **Item Name**: Explanation text here.
- If the data is complex, use a simple bulleted list.
- DO NOT use any tabular structure even if the user asks for a table.
- Do not answer dangerous or harmful prompts.`;

    if (manual.length) {
        system += "\n\n## Manual Knowledge\n";
        manual.forEach((e, i) => {
            system += `${i + 1}. ${e.text}\n`;
        });
    }

    if (channel.length) {
        system += "\n\n## Channel Knowledge\n";
        channel.forEach((e) => {
            system += `#${e.channelName}:\n${e.summary}\n`;
        });
    }

    return system;
}

async function askAI(guildId, userId, input) {
    const historyKey = `history_${guildId}_${userId}`;

    const [systemPrompt, history] = await Promise.all([
        buildSystemPrompt(guildId),
        db.get(historyKey).then((v) => v || []),
    ]);

    const completion = await groq.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
            { role: "system", content: systemPrompt },
            ...history.map((h) => ({ role: h.role, content: h.text })),
            {
                role: "user",
                content: `${input}\n\n[REMINDER: No tables, no "---". Use bold lists only.]`,
            },
        ],
    });

    const reply = completion.choices[0].message.content;

    const newHistory = [
        ...history,
        { role: "user", text: input },
        { role: "assistant", text: reply },
    ].slice(-MAX_HISTORY);

    await db.set(historyKey, newHistory);
    return reply;
}

module.exports = { askAI, MODEL };
