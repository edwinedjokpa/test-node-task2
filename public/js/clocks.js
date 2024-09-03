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

export { updateClocks };
