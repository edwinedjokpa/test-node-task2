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

async function updateClickCount() {
  try {
    const response = await fetch("/analytic/count");
    const data = await response.json();
    document.getElementById("click-count").textContent = data.count;
  } catch (error) {
    console.error("Failed to fetch click count:", error);
  }
}

async function fetchWidgets() {
  const widgets = document.querySelectorAll("[data-widget-name]");

  widgets.forEach((widget) => {
    widget.addEventListener("click", () => {
      const widgetName = widget.getAttribute("data-widget-name");
      logWidgetClick(widgetName);
    });
  });
}

async function exportWidgets() {
  const exportButton = document.getElementById("export-xml-button");

  exportButton.addEventListener("click", () => {
    window.location.href = "/analytic/export";
  });
}

export { fetchWidgets, updateClickCount, exportWidgets };
