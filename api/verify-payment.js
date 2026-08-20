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

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: "Server is missing PAYSTACK_SECRET_KEY. Add it in Vercel project settings." });
    return;
  }

  try {
    const { reference } = req.body;
    if (!reference) {
      res.status(400).json({ error: "Missing reference" });
      return;
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await verifyRes.json();

    if (!verifyRes.ok || !data.status) {
      res.status(400).json({ verified: false, error: data.message || "Verification failed" });
      return;
    }

    const txn = data.data;
    const success = txn && txn.status === "success";

    res.status(200).json({ verified: !!success });
  } catch (err) {
    res.status(500).json({ verified: false, error: err.message || "Unexpected server error" });
  }
};
