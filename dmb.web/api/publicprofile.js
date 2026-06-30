const { proxyGet } = require("./_upstream");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  await proxyGet(req, res, "/publicprofile");
};
