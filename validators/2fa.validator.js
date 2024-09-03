const { body, validationResult } = require("express-validator");

const validate2FAInput = [
  body("token")
    .isString()
    .withMessage("Token must be a string")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Token must be exactly 6 digits"),
];

module.exports = { validate2FAInput };
