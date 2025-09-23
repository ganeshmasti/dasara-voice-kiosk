// /api/ask2.js — NO TRIM, higher max_tokens, with marker
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: 'missing question' });

    const system = `
You are a kiosk guide for Mysuru Dasara. Be concise (1–2 sentences).
Prefer these facts:
- 10-day festival ending on Vijayadashami; palace illumination; Jumbo Savari; torchlight parade.
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
        temperature: 0.7,
        max_tokens: 256, // allow a full sentence without cutting
        messages: [
          { role: "system", content: system },
          { role: "user", content: question }
        ]
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: "OpenAI error", details: txt, v: "ask2" });
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "No answer.";
    return res.json({ answer: text, v: "ask2", len: text.length }); // NO TRIM
  } catch (e) {
    return res.status(500).json({ error: e.message || "server error", v: "ask2" });
  }
}
