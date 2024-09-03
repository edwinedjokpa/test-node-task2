const { v4: uuidv4 } = require("uuid");
const redisClient = require("./redisClient");

const setupSocketIO = (io) => {
  io.on("connection", (socket) => {
    const userId = uuidv4();
    console.log(`User ${userId} connected`);

    redisClient
      .lRange("chat", 0, -1)
      .then((messages) => {
        messages.forEach((message) => socket.emit("message", message));
      })
      .catch((err) => {
        console.error("Error fetching messages from Redis:", err);
      });

    socket.on("message", (message) => {
      redisClient
        .rPush("chat", message)
        .then(() => {
          io.emit("message", message);
        })
        .catch((err) => {
          console.error("Error pushing message to Redis:", err);
        });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  const redisSubscriber = redisClient.duplicate();
  redisSubscriber.subscribe("chat_updates", (err) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err);
    }
  });

  redisSubscriber.on("message", (channel, message) => {
    io.emit("message", message);
  });
};

module.exports = setupSocketIO;
