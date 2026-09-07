const { getLeadStatusByEmail, pipelineTokenOk } = require("../_leadStore");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  if (!pipelineTokenOk(req)) {
    res.status(401).json({ message: "Missing or invalid pipeline token." });
    return;
  }

  const email = String(req.query?.email || "").trim();
  if (!email) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const status = await getLeadStatusByEmail(email);
    res.status(200).json({ status });
  } catch (error) {
    console.error(`leads/status: ${error?.message || error}`);
    res.status(502).json({ message: error.message || "Could not read lead status." });
  }
};
