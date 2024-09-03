import { updateClocks } from "./clocks.js";
import { calculateCoins } from "./coin_calculator.js";
import { image } from "./image.js";
import { map } from "./map.js";
import { fetchRedditPosts } from "./reddit.js";
import { twoFactor } from "./twofactor.js";
import { updateWeather } from "./weather.js";
import { fetchWidgets, exportWidgets, updateClickCount } from "./widget.js";

// Update Weather and Clock every interval
document.addEventListener("DOMContentLoaded", () => {
  // update weather
  updateWeather();
  setInterval(updateWeather, 300000);

  // update clocks
  updateClocks();
  setInterval(updateClocks, 1000);

  // fetch reddit posts
  fetchRedditPosts();

  // update widgets
  fetchWidgets();
  exportWidgets();
  updateClickCount();
  setInterval(updateClickCount, 60000);

  // map
  map();

  // calculate coins
  calculateCoins();

  // 2FA
  twoFactor();

  // images
  image();
});
