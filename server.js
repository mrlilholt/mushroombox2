const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config(); // For managing environment variables

// Initialize Express App
const app = express();

// Create HTTP Server for Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// Particle API Config
const PARTICLE_ACCESS_TOKEN = process.env.PARTICLE_ACCESS_TOKEN; // Store your Particle access token in .env
const PARTICLE_DEVICE_ID = process.env.PARTICLE_DEVICE_ID; // Store your Particle device ID in .env
const PARTICLE_EVENT_NAME = "environmentData"; // Main data event from Particle
const PARTICLE_STREAM_URL = `https://api.particle.io/v1/devices/events/${PARTICLE_EVENT_NAME}?access_token=${PARTICLE_ACCESS_TOKEN}`;

// Variables to store latest environment data
let latestData = {
  temperature: null,
  humidity: null,
  warning: null,
};

// Listen to Particle Cloud Events
axios
  .get(PARTICLE_STREAM_URL, { responseType: "stream" })
  .then((response) => {
    console.log("Connected to Particle Cloud event stream...");

    response.data.on("data", (chunk) => {
      const eventString = chunk.toString().trim();

      if (eventString.startsWith("data:")) {
        try {
          const event = JSON.parse(eventString.replace("data: ", ""));
          const eventData = JSON.parse(event.data);

          // Update latest temperature and humidity data
          latestData.temperature = eventData.temperature;
          latestData.humidity = eventData.humidity;

          console.log("Updated Data:", latestData);

          // Broadcast data to connected clients
          io.emit("update", latestData);

          // Check for warning conditions
          if (event.name === "temperatureWarning") {
            latestData.warning = `Warning: Temperature reached ${eventData}°F!`;
            io.emit("warning", { message: latestData.warning });
          }
        } catch (error) {
          console.error("Error parsing event data:", error);
        }
      }
    });
  })
  .catch((error) => {
    console.error("Error connecting to Particle Cloud:", error.message);
  });

// Serve static files for the dashboard (if hosting locally)
app.use(express.static("public")); // Ensure your `index.html` is in the `public` folder

// Fallback Route
app.get("/", (req, res) => {
  res.send("Mushroom Box Dashboard Backend is Running!");
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
