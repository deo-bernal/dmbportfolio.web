const { pipelineTokenOk, sendNurtureEmail } = require("../_leadStore");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  if (!pipelineTokenOk(req)) {
    res.status(401).json({ message: "Missing or invalid pipeline token." });
    return;
  }

  const body = req.body || {};
  const step = Number(body.step);
  const email = String(body.email || "").trim();
  if ((step !== 1 && step !== 2) || !email) {
    res.status(400).json({ message: "Provide step 1 or 2 and an email." });
    return;
  }

  try {
    const result = await sendNurtureEmail(step, {
      email,
      name: body.name,
      need: body.need,
      bookingUrl: body.bookingUrl,
    });
    res.status(result.sent ? 200 : 502).json(result);
  } catch (error) {
    console.error(`leads/nurture: ${error?.message || error}`);
    res.status(502).json({ message: error.message || "Could not send nurture email." });
  }
};
