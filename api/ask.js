// /api/ask.js — Vercel Node serverless function (Node 18+)
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: 'missing question' });

    const system = `
You are a kiosk guide for Mysuru Dasara. Be concise (<= 2 sentences).
Prefer these facts:
- 10-day festival ending on Vijayadashami; main events: palace illumination, Jumbo Savari procession, torchlight parade.
- Key places: Mysore Palace, Chamundi Hills, Mysuru Zoo, Jaganmohan Palace, Karanji Lake.
- Elephant team leads the golden howdah.
If unsure, say: "I'm not sure—ask a guide."
`.trim();

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 160,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question }
        ]
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: "OpenAI error", details: txt });
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "No answer.";
    return res.json({ answer: text });

  } catch (e) {
    return res.status(500).json({ error: e.message || "server error" });
  }
}
