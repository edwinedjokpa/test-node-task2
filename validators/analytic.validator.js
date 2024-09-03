const { body } = require("express-validator");

const saveAnalyticsValidator = [
  body("widget_name")
    .notEmpty()
    .withMessage("Widget name is required")
    .isString()
    .withMessage("Widget name must be a string")
    .trim()
    .escape(),
];

module.exports = { saveAnalyticsValidator };
