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

async function updateClocks() {
  try {
    const response = await fetch("/api/time");

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const utcTime = new Date(data.utcTime);

    // Define time zones and their display IDs
    const timeZones = {
      "london-time": "Europe/London",
      "est-time": "America/New_York",
      "nigeria-time": "Africa/Lagos",
      "pakistan-time": "Asia/Karachi",
    };

    // Update each clock
    for (const [id, timeZone] of Object.entries(timeZones)) {
      const localTime = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // Use 24-hour format
      }).format(utcTime);

      updateClockElement(id, localTime);
    }
  } catch (error) {
    console.error("Error fetching time:", error);
  }
}

function updateClockElement(id, time) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = time;
  }
}

// Update Weather and Clock every interval
document.addEventListener("DOMContentLoaded", () => {
  updateWeather();
  setInterval(updateWeather, 300000);
  updateClocks();
  setInterval(updateClocks, 1000);
});

document.addEventListener("DOMContentLoaded", function () {
  const inputElement = document.getElementById("airport-input");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const distanceElement = document.getElementById("distance");
  let map;
  let timeout;

  // Haversine formula to calculate distance between two points
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function initMap(lat, lon) {
    if (map) {
      map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
      map.getView().setZoom(12);
      return;
    }

    map = new ol.Map({
      target: "map",
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([lon, lat]),
        zoom: 12,
      }),
    });

    const marker = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
    });

    const vectorSource = new ol.source.Vector({
      features: [marker],
    });

    const markerLayer = new ol.layer.Vector({
      source: vectorSource,
    });

    map.addLayer(markerLayer);
  }

  inputElement.addEventListener("input", function () {
    const query = inputElement.value.trim();

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (query.length >= 3) {
        fetch(`/airports?search=${query}`)
          .then((response) => response.json())
          .then((data) => {
            dropdownMenu.innerHTML = "";
            dropdownMenu.style.display = "block";

            if (data.length > 0) {
              data.forEach((airport) => {
                const item = document.createElement("a");
                item.className = "dropdown-item";
                item.href = "#";
                item.textContent = airport.name;

                item.addEventListener("click", function () {
                  inputElement.value = airport.name;
                  dropdownMenu.style.display = "none";

                  initMap(airport.latitude_deg, airport.longitude_deg);

                  // Calculate distance from Arctic Circle
                  const arcticCircleLat = 66.5;
                  const distance = haversineDistance(
                    arcticCircleLat,
                    0,
                    airport.latitude_deg,
                    airport.longitude_deg
                  );
                  distanceElement.textContent = `${distance.toFixed(2)} KM`;
                });

                dropdownMenu.appendChild(item);
              });
            } else {
              const noResults = document.createElement("a");
              noResults.className = "dropdown-item disabled";
              noResults.href = "#";
              noResults.textContent = "No airports found";
              dropdownMenu.appendChild(noResults);
            }
          })
          .catch((error) => console.error("Error fetching data:", error));
      } else {
        dropdownMenu.style.display = "none";
      }
    }, 300);
  });

  document.addEventListener("click", function (event) {
    if (
      !inputElement.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
    }
  });

  inputElement.addEventListener("blur", function () {
    setTimeout(() => {
      dropdownMenu.style.display = "none";
    }, 200);
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  const redditPostsList = document.getElementById("reddit-posts");

  try {
    const response = await fetch("/reddit/programming");

    if (!response.ok) {
      console.log(`HTTP error! Status: ${response.status}`);
    }

    const posts = await response.json();

    posts.forEach((post) => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";

      const shortUrl =
        post.url.length > 15 ? `${post.url.slice(15, 40)}...` : post.url;

      listItem.innerHTML = ` 
          <p class="mb-1">${post.author}</p>
          <h6 class="mb-1">${post.title}</h6>
          <p>
            <a class="text-danger" href="${post.url}" target="_blank">${shortUrl}
            <i class="fa fa-external-link text-danger"></i></a>
          </p>
        `;

      redditPostsList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error fetching Reddit posts:", error.message);
  }
});

async function logWidgetClick(widgetName) {
  try {
    await fetch("/analytic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ widget_name: widgetName }),
    });
  } catch (error) {
    console.error("Failed to log widget click:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const widgets = document.querySelectorAll("[data-widget-name]");

  widgets.forEach((widget) => {
    widget.addEventListener("click", () => {
      const widgetName = widget.getAttribute("data-widget-name");
      logWidgetClick(widgetName);
    });
  });
});

async function updateClickCount() {
  try {
    const response = await fetch("/analytic/count");
    const data = await response.json();
    document.getElementById("click-count").textContent = data.count;
  } catch (error) {
    console.error("Failed to fetch click count:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateClickCount();
  setInterval(updateClickCount, 60000);
});

document.addEventListener("DOMContentLoaded", () => {
  const exportButton = document.getElementById("export-xml-button");

  exportButton.addEventListener("click", () => {
    window.location.href = "/analytic/export";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const calculateButton = document.getElementById("calculate-button");
  const amountInput = document.getElementById("amount-input");
  const resultList = document.getElementById("result-list");

  calculateButton.addEventListener("click", async () => {
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("/calculate-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      resultList.innerHTML = "";

      if (response.ok) {
        Object.keys(data).forEach((key) => {
          const li = document.createElement("li");
          li.className = "list-group-item";
          li.textContent = `${key}: ${data[key]}`;
          resultList.appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.className = "list-group-item text-danger";
        li.textContent = data.error || "Error occurred";
        resultList.appendChild(li);
      }
    } catch (error) {
      console.error("Failed to calculate:", error);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("upload-button");
  const fileInput = document.getElementById("file-input");
  const latestImage = document.getElementById("latest-image");

  async function loadLatestImage() {
    try {
      const response = await fetch("/latest-image");
      const data = await response.json();
      if (data.image_path) {
        latestImage.src =
          data.image_path ||
          "https://cdn-icons-png.flaticon.com/512/13/13626.png";
      }
    } catch (error) {
      console.error("Failed to load latest image:", error);
    }
  }

  loadLatestImage();

  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          latestImage.src = data.image_path;
        } else {
          alert("Failed to upload image");
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const modalElement = document.getElementById("twoFactorModal");

  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);

    if (!window.isAuthenticated) {
      modal.show();
    }

    const qrCodeContainer = document.getElementById("qr-code-container");
    const tokenInput = document.getElementById("token");
    const verifyButton = document.getElementById("verify-2fa");

    const fetchQRCode = async () => {
      try {
        const response = await fetch("/setup-2fa");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (qrCodeContainer) {
            qrCodeContainer.innerHTML = `<img src="${data.qrCodeUrl}" alt="QR Code">`;
          }
        } else {
          throw new Error("Expected JSON but received something else.");
        }
      } catch (error) {
        console.error("Error fetching QR code:", error.message);
      }
    };

    fetchQRCode();

    const handleVerify2FA = async () => {
      const token = tokenInput.value;

      try {
        const response = await fetch("/verify-2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (data.success) {
          window.location.reload();
        } else {
          alert("Invalid token");
        }
      } catch (error) {
        alert("Error verifying token: " + error.message);
      }
    };

    if (verifyButton) {
      verifyButton.addEventListener("click", handleVerify2FA);
    }
  }
});
