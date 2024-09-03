const { validationResult } = require("express-validator");
const js2xml = require("xml-js");
const db = require("../models/index");

async function saveAnalytics(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Extract data from request
  const { widget_name } = req.body;
  const browser_type = req.headers["user-agent"];

  // Validate widget_name
  if (!widget_name) {
    return res
      .status(400)
      .json({ success: false, error: "Widget name is required" });
  }

  try {
    // Save data to the database
    await db.Analytic.create({
      widget_name,
      browser_type,
    });
    res
      .status(200)
      .json({ success: true, message: "Analytics logged successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

async function getAnalyticsCount(req, res) {
  try {
    const count = await db.Analytic.count();
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

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

    res.setHeader("Content-disposition", "attachment; filename=analytics.xml");
    res.setHeader("Content-type", "application/xml");
    res.send(xml);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

module.exports = { saveAnalytics, getAnalyticsCount, exportAnalytics };
