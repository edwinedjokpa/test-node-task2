async function calculateCoins() {
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
}

export { calculateCoins };
