const { validationResult } = require("express-validator");
const axios = require("axios");
const db = require("../models/index");
const js2xml = require("xml-js");
const fs = require("fs/promises");
const path = require("path");
const csvParser = require("csv-parser");
const { PassThrough } = require("stream");
const { deleteFileIfExists } = require("../utils/file");
require("dotenv").config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const airportsCsvFile = path.join(__dirname, "../airports.csv");

async function getWeather(req, res, next) {
  const ipAddress = req.headers["x-forwarded-for"] || "84.17.50.168";

  if (Array.isArray(ipAddress)) {
    ipAddress = ipAddress[0];
  }

  if (!ipAddress) {
    return res.status(400).send("IP address not found");
  }

  const ipResponse = await axios.get(`https://ipinfo.io/${ipAddress}`);

  const { city } = ipResponse.data;

  const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city}&aqi=no`;

  try {
    const response = await axios.get(url);
    const weatherData = response.data;

    // Extract the relevant weather data
    const temperature = weatherData.current.temp_c;
    const condition = weatherData.current.condition.text.toLowerCase();

    res.status(200).json({ temperature, condition });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function getTime(req, res) {
  try {
    const now = new Date();
    res.status(200).json({ utcTime: now.toISOString() });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function getAirports(req, res, next) {
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

        res.status(200).json(filteredAirports);
      })
      .on("error", (error) => {
        throw new Error("Error parsing CSV file:");
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function getRedditPosts(req, res) {
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
}

// API endpoint to log analytics
async function saveAnalytics(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

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
}

async function getAnalyticsCount(req, res) {
  try {
    const count = await db.Analytic.count();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

// XML export route
async function exportAnalytics(req, res) {
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
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function calculateCoins(req, res) {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "File is required!" });
    }

    const file = req.file;

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      deleteFileIfExists(req.file.path);
      return res
        .status(400)
        .json({ success: false, error: "Invalid file type" });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const image = await db.Image.create({ image_path: imagePath });

    if (!image) {
      deleteFileIfExists(req.file.path);
      throw new Error("Failed to save image information to the database");
    }

    res.json({ success: true, image_path: imagePath });
  } catch (error) {
    console.error("Error uploading image:", error);
    deleteFileIfExists(req.file.path);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getLatestImage(req, res) {
  try {
    const latestImage = await db.Image.findOne({
      order: [["upload_date", "DESC"]],
    });

    res.json({
      success: true,
      image_path: latestImage
        ? latestImage.image_path
        : "https://cdn-icons-png.flaticon.com/512/126/126477.png",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch latest image",
    });
  }
}

module.exports = {
  getWeather,
  getTime,
  getAirports,
  getRedditPosts,
  saveAnalytics,
  exportAnalytics,
  getAnalyticsCount,
  calculateCoins,
  uploadImage,
  getLatestImage,
};
