// pages/kiosk.js — simple Q&A page with optional mic and speech reply
import { useState } from "react";

export default function Kiosk() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true); setErr(""); setA(""); setSources([]);
    try {
      const r = await fetch("/api/ask_perplexity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Ask failed");
      setA(data.answer || "");
      setSources(data.sources || []);
      // Speak the answer (optional)
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance((data.answer || "").slice(0, 300));
        u.lang = "en-IN"; window.speechSynthesis.speak(u);
      } catch {}
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Please type."); return; }
    const rec = new SR();
    rec.lang = "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (ev) => { setQ(ev.results[0][0].transcript); setTimeout(ask, 50); };
    rec.start();
  }

  return (
    <div style={{fontFamily:"system-ui,-apple-system,Segoe UI,Roboto", padding:"24px", maxWidth:680, margin:"0 auto"}}>
      <h1 style={{margin:0}}>Mysuru Dasara Guide</h1>
      <p style={{marginTop:8, opacity:.8}}>Ask about timings, Jumbo Savari, routes, history, etc.</p>

      <div style={{display:"flex", gap:8, marginTop:12}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") ask(); }}
          placeholder="Type your question…"
          style={{flex:1, padding:"12px 14px", fontSize:16, border:"1px solid #ccc", borderRadius:12}}
        />
        <button onClick={ask} disabled={loading || !q.trim()}
          style={{padding:"12px 16px", fontSize:16, borderRadius:12, border:"1px solid #999", background:"#111", color:"#fff"}}>
          {loading ? "Asking…" : "Ask"}
        </button>
        <button onClick={startMic} title="Speak your question"
          style={{padding:"12px 14px", fontSize:16, borderRadius:12, border:"1px solid #999", background:"#f6f6f6"}}>
          🎙️
        </button>
      </div>

      {err && <div style={{marginTop:16, color:"#b00020"}}>Error: {err}</div>}

      {a && (
        <div style={{marginTop:20, padding:16, border:"1px solid #eee", borderRadius:12, background:"#fafafa"}}>
          <strong>Answer:</strong> {a}
        </div>
      )}

      {!!sources?.length && (
        <div style={{marginTop:12, fontSize:14, opacity:.8}}>
          Sources:{" "}
          {sources.slice(0,3).map((s,i)=> {
            const url = s.url || s.link || s;
            const host = String(url).replace(/^https?:\/\//,"").split("/")[0];
            return <span key={i}><a href={url} target="_blank" rel="noreferrer">{host}</a>{i<Math.min(3,sources.length)-1?", ":""}</span>
          })}
        </div>
      )}

      <div style={{marginTop:28, fontSize:13, opacity:.6}}>
        Tip: allow mic access on your phone for hands-free questions. The page speaks answers automatically.
      </div>
    </div>
  );
}
