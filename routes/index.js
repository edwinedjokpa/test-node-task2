var express = require("express");
var router = express.Router();
const axios = require("axios");
const db = require("../models/index");
const { parseString } = require("xml2js");
const js2xml = require("xml-js");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const csvParser = require("csv-parser");
const { PassThrough } = require("stream");
const rateLimit = require("express-rate-limit");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const redisClient = require("../redisClient");
require("dotenv").config();

// /** Chat Room Task */

router.get("/chat", (req, res) => {
  res.render("chat");
});

router.post("/send", async (req, res) => {
  const { message } = req.body;
  if (message) {
    try {
      await redisClient.rPush("chat", message);
      res.status(200).send("Message sent");
    } catch (err) {
      console.error("Error pushing message:", err);
      res.status(500).send("Error sending message");
    }
  } else {
    res.status(400).send("Message cannot be empty");
  }
});

router.get("/poll", async (req, res) => {
  try {
    const length = await redisClient.lLen("chat");
    if (length > 0) {
      res.status(200).send("Update available");
    } else {
      res.status(204).send();
    }
  } catch (err) {
    console.error("Error checking chat length:", err);
    res.status(500).send("Error checking chat length");
  }
});

router.get("/chat/all", async (req, res) => {
  try {
    const messages = await redisClient.lRange("chat", 0, -1);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Error fetching messages");
  }
});

router.post("/save", async (req, res) => {
  try {
    const messages = await redisClient.lRange("chat", 0, -1);

    if (messages.length === 0) {
      return res.status(400).json({ message: "No messages to save" });
    }

    await db.Chat.create({
      chat_messages: JSON.stringify(messages.join("\n")),
      created_at: new Date(),
    });

    // Optionally clear Redis chat data after saving
    await redisClient.del("chat");

    res.status(200).json({ message: "Chat saved successfully" });
  } catch (err) {
    console.error("Error saving chat:", err);
    res.status(500).json({ message: "Error saving chat" });
  }
});

/*** Other Tasks */

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many requests from this IP, please try again later.",
});

// Test the database connection and sync models
async function initializeDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected...");
    // Sync all models
    await db.sequelize.sync({ alter: true, logging: false });
  } catch (err) {
    console.error("Error:", err);
  }
}

initializeDatabase();

/* GET home page. */
router.get("/", function (req, res, next) {
  const isAuthenticated = req.session.authenticated || false;
  res.render("index", { title: "Express", isAuthenticated });
});

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

router.get("/api/weather", async (req, res) => {
  // let ipAddress = req.headers["x-forwarded-for"] || "102.89.32.134";

  // if (Array.isArray(ipAddress)) {
  //   ipAddress = ipAddress[0];
  // }

  // console.log(ipAddress);
  // if (!ipAddress) {
  //   return res.status(400).send("IP address not found");
  // }

  // const ipResponse = await axios.get(`https://ipinfo.io/${ipAddress}`);
  // console.log(ipResponse);

  // const { city } = ipResponse.data;

  const city = "Asaba";
  const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city}&aqi=no`;

  try {
    const response = await axios.get(url);
    const weatherData = response.data;

    // Extract the relevant weather data
    const temperature = weatherData.current.temp_c;
    const condition = weatherData.current.condition.text.toLowerCase();

    res.json({ temperature, condition });
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

router.get("/api/time", (req, res) => {
  const now = new Date();
  res.json({ utcTime: now.toISOString() });
});

// Define the path to your CSV file
const airportsCsvFile = path.join(__dirname, "../airports.csv");

router.get("/airports", async (req, res) => {
  try {
    const results = [];
    const stream = new PassThrough();

    const fileData = await fs.readFile(airportsCsvFile);

    stream.end(fileData);

    stream
      .pipe(csvParser())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        // Sanitize and filter the search query
        const searchQuery = req.query.search?.toLowerCase() || "";
        if (searchQuery.length < 3) {
          return res.json([]);
        }

        const filteredAirports = results.filter(
          (airport) =>
            airport.name.toLowerCase().includes(searchQuery) ||
            airport.iata_code.toLowerCase().includes(searchQuery)
        );

        res.json(filteredAirports);
      })
      .on("error", (error) => {
        console.error("Error parsing CSV file:", error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/reddit/programming", async (req, res) => {
  try {
    const response = await fetch("https://www.reddit.com/r/programming.json");

    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch Reddit data.");
    }

    const data = await response.json();
    const posts = data.data.children
      .map((child) => ({
        title: child.data.title,
        author: child.data.author,
        url: child.data.url,
      }))
      .filter((_, index) => index % 2 === 0)
      .slice(0, 4);

    res.json(posts);
  } catch (error) {
    console.error("Error fetching Reddit data:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// API endpoint to log analytics
router.post("/analytic", apiLimiter, async (req, res) => {
  const { widget_name } = req.body;
  const browser_type = req.headers["user-agent"];

  if (!widget_name) {
    return res.status(400).json({ error: "Widget name is required" });
  }

  try {
    await db.Analytic.create({
      widget_name,
      browser_type,
    });
    res.status(200).json({ message: "Analytics logged successfully" });
  } catch (error) {
    console.error("Error logging analytics:", error);
    res.status(500).json({ error: "Failed to log analytics" });
  }
});

router.get("/analytic/count", async (req, res) => {
  try {
    const count = await db.Analytic.count();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error retrieving count:", error);
    res.status(500).json({ error: "Failed to retrieve count" });
  }
});

// XML export route
router.get("/analytic/export", async (req, res) => {
  try {
    // Fetch data from the database
    const analytics = await db.Analytic.findAll();

    // Convert data to XML
    const json = analytics.map((record) => record.toJSON());
    const xml = js2xml.json2xml(
      { AnalyticRecords: json },
      { compact: true, spaces: 4 }
    );

    // Set headers and send XML file
    res.setHeader("Content-disposition", "attachment; filename=analytics.xml");
    res.setHeader("Content-type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Error exporting analytics:", error);
    res.status(500).send("Failed to export analytics");
  }
});

router.post("/calculate-coins", (req, res) => {
  const { amount } = req.body;

  if (amount == null || isNaN(amount)) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  let remaining = parseFloat(amount);
  const result = {};

  const billsAndCoins = [
    { name: "$20 bill", value: 20.0 },
    { name: "$10 bill", value: 10.0 },
    { name: "$5 bill", value: 5.0 },
    { name: "$1 bill", value: 1.0 },
    { name: "25¢", value: 0.25 },
    { name: "10¢", value: 0.1 },
    { name: "5¢", value: 0.05 },
    { name: "1¢", value: 0.01 },
  ];

  billsAndCoins.forEach((billOrCoin) => {
    const count = Math.floor(remaining / billOrCoin.value);
    if (count > 0) {
      result[billOrCoin.name] = count;
      remaining = (remaining % billOrCoin.value).toFixed(2);
    }
  });

  res.json(result);
});

const upload = multer({ dest: "uploads/" });

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const imagePath = `/uploads/${file.filename}`;

    // Save image information to the database
    const image = await db.Image.create({ image_path: imagePath });

    res.json({ success: true, image_path: imagePath });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ success: false, error: "Failed to upload image" });
  }
});

// Route to get the latest uploaded image
router.get("/latest-image", async (req, res) => {
  try {
    const latestImage = await db.Image.findOne({
      order: [["upload_date", "DESC"]],
    });

    res.json({
      image_path: latestImage
        ? latestImage.image_path
        : "https://cdn-icons-png.flaticon.com/512/126/126477.png",
    });
  } catch (error) {
    console.error("Error fetching latest image:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch latest image" });
  }
});

const TWO_FACTOR_SECRET = process.env.TWO_FACTOR_SECRET;
router.get("/setup-2fa", (req, res) => {
  const secret = speakeasy.generateSecret({ name: TWO_FACTOR_SECRET });
  QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) {
      return res.status(500).send("Error generating QR code");
    }
    req.session.secret = secret.base32;
    res.json({ qrCodeUrl: data_url });
  });
});

router.post("/verify-2fa", (req, res) => {
  const { token } = req.body;
  const secret = req.session.secret;

  if (!secret) {
    return res.status(400).send("2FA setup not completed");
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });

  if (verified) {
    req.session.authenticated = true;
    res.send({ success: true });
  } else {
    res.status(400).send("Invalid token");
  }
});

module.exports = router;
