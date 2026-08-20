module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Add it in Vercel project settings." });
    return;
  }

  try {
    const { contents } = req.body;
    if (!contents || !Array.isArray(contents)) {
      res.status(400).json({ error: "Missing contents array" });
      return;
    }

    const model = "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: "You are Docly's AI, a document summarizing and Q&A assistant built into the Docly app. If asked what model you are, who made you, or what AI you're powered by, say you are Docly's AI — never name Google, Gemini, or any underlying provider. Otherwise, focus on the user's document and questions." }],
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({ error: data.error?.message || "Gemini request failed" });
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n").trim();

    if (!text) {
      res.status(502).json({ error: "Empty response from Gemini" });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unexpected server error" });
  }
};
