const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { validationResult } = require("express-validator");

require("dotenv").config();

const TWO_FACTOR_SECRET = process.env.TWO_FACTOR_SECRET;

async function setup2FA(req, res) {
  try {
    // Generate 2FA secret
    const secret = speakeasy.generateSecret({ name: TWO_FACTOR_SECRET });

    // Generate QR code
    const dataUrl = await new Promise((resolve, reject) => {
      QRCode.toDataURL(secret.otpauth_url, (err, url) => {
        if (err) {
          return reject(err);
        }
        resolve(url);
      });
    });

    req.session.secret = secret.base32;
    res.status(200).json({ success: true, qrCodeUrl: dataUrl });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

// Verify 2FA function
async function verify2FA(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token } = req.body;
  const secret = req.session.secret;

  if (!secret) {
    return res
      .status(400)
      .json({ success: false, error: "2FA setup not completed" });
  }

  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });

    if (verified) {
      req.session.authenticated = true;
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, error: "Invalid token" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

module.exports = { setup2FA, verify2FA };
