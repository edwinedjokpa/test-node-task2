async function updateWeather() {
  try {
    const response = await fetch("/api/weather");
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    document.getElementById(
      "temperature"
    ).textContent = `${data.temperature} °C`;

    const weatherImage = {
      sunny:
        "https://png.pngtree.com/png-clipart/20201209/original/pngtree-sun-png-clipart-colored-png-image_5656301.png",
      rain: "https://png.pngtree.com/png-clipart/20220506/ourmid/pngtree-rain-rain-raindrops-falling-raindrops-weather-png-image_4563814.png",
      snow: "https://png.pngtree.com/png-vector/20230915/ourmid/pngtree-illustration-of-3d-snowflake-png-image_10076165.png",
      default:
        "https://png.pngtree.com/png-clipart/20220210/ourmid/pngtree-white-cloud-png-element-with-transparent-background-png-image_4383800.png",
    };

    const imageKey = data.condition.includes("sunny")
      ? "sunny"
      : data.condition.includes("rain") || data.condition.includes("drizzle")
      ? "rain"
      : data.condition.includes("snow")
      ? "snow"
      : "default";

    document.getElementById("weather-image").src = weatherImage[imageKey];
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

export { updateWeather };
