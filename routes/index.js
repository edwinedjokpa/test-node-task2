var express = require("express");
var router = express.Router();
const {
  messageValidator,
  saveMessagesValidator,
} = require("../validators/chat.validator");
const {
  ChatController,
  HomeController,
  AnalyticController,
  TwoFactorController,
} = require("../controllers");
const { saveAnalyticsValidator } = require("../validators/analytic.validator");
const { apiLimiter } = require("../middlewares/analytics.middleware");
const {
  calculateCoinsValidator,
} = require("../validators/coin_calculator.validator");
const upload = require("../middlewares/upload.middleware");
const { validate2FAInput } = require("../validators/2fa.validator");

/** Chat Room Task */

// render chat page
router.get("/chat", (req, res) => {
  res.render("chat");
});

// send message
router.post("/send", messageValidator, ChatController.sendMessage);

// poll messages
router.get("/poll", ChatController.pollMessages);

// fetching messages
router.get("/chat/all", ChatController.getMessages);

// saving chat messages
router.post("/save", saveMessagesValidator, ChatController.saveMessages);

/* GET home page. */
router.get("/", function (req, res, next) {
  const isAuthenticated = req.session.authenticated || false;
  res.render("index", { title: "Express", isAuthenticated });
});

/*** Other Tasks */

// fetch weather
router.get("/api/weather", HomeController.getWeather);

// fetch time
router.get("/api/time", HomeController.getTime);

// fetch airports
router.get("/airports", HomeController.getAirports);

router.get("/reddit/programming", HomeController.getRedditPosts);

// save analytics
router.post(
  "/analytic",
  apiLimiter,
  saveAnalyticsValidator,
  AnalyticController.saveAnalytics
);

// fetch analytics count
router.get("/analytic/count", AnalyticController.getAnalyticsCount);

// XML export analytics
router.get("/analytic/export", AnalyticController.exportAnalytics);

router.post(
  "/calculate-coins",
  calculateCoinsValidator,
  HomeController.calculateCoins
);

// upload image
router.post(
  "/upload-image",
  upload.single("image"),
  HomeController.uploadImage
);

//  get the latest uploaded image
router.get("/latest-image", HomeController.getLatestImage);

// setup 2FA
router.get("/setup-2fa", TwoFactorController.setup2FA);

// verify 2FA
router.post("/verify-2fa", validate2FAInput, TwoFactorController.verify2FA);

module.exports = router;
