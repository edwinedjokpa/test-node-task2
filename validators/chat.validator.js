const { body } = require("express-validator");

// Validator for sending chat messages
const messageValidator = [
  body("message")
    .notEmpty()
    .withMessage("Message cannot be empty")
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .escape(),
];

// Validator for saving chat messages
const saveMessagesValidator = [
  body("messages")
    .isArray()
    .withMessage("Messages must be an array")
    .notEmpty()
    .withMessage("Messages cannot be empty")
    .custom((messages) => {
      if (messages.some((msg) => typeof msg !== "string")) {
        throw new Error("All messages must be strings");
      }
      return true;
    }),
];

module.exports = { messageValidator, saveMessagesValidator };
