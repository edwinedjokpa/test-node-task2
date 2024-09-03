const { body } = require("express-validator");

const calculateCoinsValidator = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
];

module.exports = { calculateCoinsValidator };
