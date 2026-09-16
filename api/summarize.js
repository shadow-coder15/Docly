module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Docly-Mode"
  );

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
    res.status(500).json({
      error:
        "Server is missing GEMINI_API_KEY. Add it in Vercel project settings.",
    });
    return;
  }

  const model = "gemini-3.6-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const identityRule =
    "You are Docly's AI, a document summarizing and Q&A assistant built into the Docly app. If asked what model you are, who made you, or what AI you're powered by, say you are Docly's AI — never name Google, Gemini, or any underlying provider.";

  const isPdfRequest =
    req.headers["content-type"]?.toLowerCase().includes("application/pdf");

  const mode =
    req.headers["x-docly-mode"] ||
    (isPdfRequest ? "summary" : null);

  try {
    let contents;

    /*
     * NEW PDF FLOW
     *
     * The browser sends the original PDF as binary data.
     * The server converts it to Base64 instead of the mobile browser.
     */
    if (isPdfRequest) {
      const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB server-side limit

      const pdfBuffer = await readRequestBody(req, MAX_PDF_BYTES);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        res.status(400).json({ error: "The uploaded PDF is empty." });
        return;
      }

      const pdfBase64 = pdfBuffer.toString("base64");

      contents = [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              text: "Summarize this document.",
            },
          ],
        },
      ];
    } else {
      /*
       * EXISTING JSON FLOW
       *
       * This preserves chat functionality from app.js.
       */
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body || {};

      contents = body.contents;

      if (!contents || !Array.isArray(contents)) {
        res.status(400).json({ error: "Missing contents array" });
        return;
      }
    }

    const isSummary = mode === "summary";

    const systemText = isSummary
      ? `${identityRule} You are producing an initial document summary. Return ONLY valid JSON matching this exact shape, no markdown, no extra text:
{
  "title": "short document title, plain text",
  "summary": "a 2-4 sentence plain-English TL;DR, plain text",
  "points": ["5-8 concise key points as plain strings"],
  "important": ["0-5 important caveats, risks, or things to remember; omit if none apply"],
  "tags": ["3-6 short topic tags, no # symbol"]
}
Every string value in this JSON must be plain text only. Do not use markdown formatting anywhere — no **bold**, no *italics*, no # headings, no leading "-" or "*" bullet characters, no backticks. If a point has a label like "Key Drivers", write it as plain text, for example "Key Drivers: ...", without asterisks around it.`
      : `${identityRule} Focus on the user's document and questions. Answer in plain, conversational text with no markdown formatting — no **bold**, no *italics*, no # headings, and no bullet characters.`;

    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: systemText }],
      },
    };

    if (isSummary) {
      requestBody.generationConfig = {
        responseMimeType: "application/json",
      };
    }

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({
        error: data.error?.message || "Gemini request failed",
      });
      return;
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      res.status(502).json({
        error: "Empty response from Gemini",
      });
      return;
    }

    if (isSummary) {
      try {
        const gist = JSON.parse(text);

        if (gist && typeof gist === "object") {
          res.status(200).json({ gist });
          return;
        }
      } catch (error) {
        // Return raw text if Gemini unexpectedly returns malformed JSON.
      }
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error("Docly summarize error:", err);

    res.status(500).json({
      error: err.message || "Unexpected server error",
    });
  }
};


/*
 * Reads a binary request body without requiring formidable,
 * busboy, multer, or another dependency.
 */
function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let finished = false;

    const fail = (error) => {
      if (finished) return;
      finished = true;
      reject(error);
    };

    const succeed = (buffer) => {
      if (finished) return;
      finished = true;
      resolve(buffer);
    };

    req.on("data", (chunk) => {
      if (finished) return;

      const bufferChunk = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      totalBytes += bufferChunk.length;

      if (totalBytes > maxBytes) {
        fail(
          new Error(
            `PDF is too large. Maximum allowed size is ${Math.round(
              maxBytes / 1024 / 1024
            )} MB.`
          )
        );

        if (typeof req.destroy === "function") {
          req.destroy();
        }

        return;
      }

      chunks.push(bufferChunk);
    });

    req.on("end", () => {
      if (!finished) {
        succeed(Buffer.concat(chunks, totalBytes));
      }
    });

    req.on("error", fail);
    req.on("aborted", () => {
      fail(new Error("The PDF upload was interrupted."));
    });
  });
}