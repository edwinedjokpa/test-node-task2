const { validationResult } = require("express-validator");
const db = require("../models/index");
const redisClient = require("../helpers/redisClient");

async function sendMessage(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { message } = req.body;

  try {
    await redisClient.rPush("chat", message);
    res.status(200).json({ success: true, message: "Message sent" });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
    next(err);
  }
}

async function pollMessages(req, res) {
  try {
    const length = await redisClient.lLen("chat");
    if (length < 0) {
      res.status(204).send();
    }
    res.status(200).json({ success: true, message: "Update available" });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function getMessages(req, res, next) {
  try {
    const messages = await redisClient.lRange("chat", 0, -1);
    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function saveMessages(req, res) {
  try {
    const messages = await redisClient.lRange("chat", 0, -1);

    const errors = validationResult(messages);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (messages.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No messages to save" });
    }

    await db.Chat.create({
      chat_messages: JSON.stringify(messages.join("\n")),
      created_at: new Date(),
    });

    // Optionally clear Redis chat data after saving
    await redisClient.del("chat");

    res.status(200).json({ success: true, message: "Chat saved successfully" });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

module.exports = { sendMessage, pollMessages, getMessages, saveMessages };
