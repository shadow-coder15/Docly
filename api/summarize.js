module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });

  try {
    const { contents } = req.body || {};
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: "Missing contents array." });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemText = `
You are Docly, a document understanding assistant.
For a NEW document summary, return ONLY valid JSON with this exact shape:
{
  "gist": {
    "title": "short document title",
    "summary": "2-4 sentence plain-English overview",
    "points": ["5-8 concise key points"],
    "important": ["0-5 important risks, obligations, caveats or things to remember"],
    "tags": ["3-6 short topic tags"]
  }
}
For a follow-up question, answer normally as concise plain text.
Never mention the underlying AI provider or model. Ground answers in the supplied document/context and say when the document does not contain enough information.
`.trim();

    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemText }] },
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json"
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "AI request failed." });

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n").trim();
    if (!text) return res.status(502).json({ error: "Empty response from AI." });

    try {
      const parsed = JSON.parse(text);
      if (parsed.gist) return res.status(200).json(parsed);
    } catch (_) {}

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unexpected server error." });
  }
};
