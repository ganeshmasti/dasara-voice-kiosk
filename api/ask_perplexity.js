// /api/ask_perplexity.js — Uses Perplexity's web-enabled model (returns sources)
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only", v: "ask_pplx" });
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: "missing question", v: "ask_pplx" });

    const system = `
You are a kiosk guide for Mysuru Dasara. Be concise (1–2 sentences).
Use the model's web results; include no invented dates. If dates aren't clearly available, say you don't have exact dates and advise checking the official schedule.
`.trim();

    // NOTE: Perplexity offers web-enabled models; check docs for the latest names.
    // Common choices include "sonar" or "pplx-70b-online".
    const model = "sonar"; // or "pplx-70b-online"

    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PPLX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 256,
        // Some accounts support toggles like "return_citations": true (varies by plan/model)
        messages: [
          { role: "system", content: system },
          { role: "user", content: String(question) }
        ]
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: "Perplexity error", details: txt, v: "ask_pplx" });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "No answer.";
    // Perplexity usually includes citations/urls somewhere in the payload.
    const citations =
      data?.choices?.[0]?.message?.citations ||
      data?.citations ||
      data?.search_results ||
      null;

    return res.json({ answer: text, sources: citations, v: "ask_pplx" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "server error", v: "ask_pplx" });
  }
}
