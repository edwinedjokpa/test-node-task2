document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("message");
  const chatLog = document.getElementById("chat-log");
  const sendButton = document.getElementById("send");
  const saveButton = document.getElementById("save");
  let isLeft = true;
  const socket = io();

  const updateChatLog = (messages) => {
    chatLog.innerHTML = "";
    messages.forEach((msg) => {
      const li = document.createElement("li");
      li.className = `chat-item ${isLeft ? "left" : "right"}`;
      li.innerHTML = `<div class="message">${msg}</div>`;
      chatLog.appendChild(li);
      isLeft = !isLeft;
    });
  };

  socket.on("message", (message) => {
    updateChatLog(message);
  });

  const pollForUpdates = async () => {
    try {
      const response = await fetch("/poll");
      if (response.status === 200) {
        const messagesResponse = await fetch("/chat/all");
        if (messagesResponse.ok) {
          const { messages } = await messagesResponse.json();
          updateChatLog(messages);
        }
      } else if (response.status === 204) {
        console.log("No new messages.");
      }
    } catch (error) {
      console.error("Error polling for updates:", error);
    }
  };

  sendButton.addEventListener("click", async () => {
    const message = messageInput.value.trim();
    if (message) {
      try {
        await fetch("/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });
        messageInput.value = "";
        await pollForUpdates();
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    } else {
    }
  });

  saveButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/save", {
        method: "POST",
      });
      if (response.ok) {
        alert("Chat messages saved successfully.");
      } else {
        const result = await response.json();
        console.log(result);
        alert(result.message || "Failed to save chat messages.");
      }
    } catch (error) {
      console.error("Error saving messages:", error);
      alert("Failed to save chat messages. Please try again.");
    }
  });

  setInterval(pollForUpdates, 5000);
});
