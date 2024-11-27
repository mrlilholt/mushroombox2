const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const cors = require("cors");

const app = express();

// Add CORS middleware
app.use(cors({
    origin: "https://mushroombox.netlify.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

// Create HTTP Server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://mushroombox.netlify.app",
        methods: ["GET", "POST"],
    },
});

// Particle API Config
const PARTICLE_ACCESS_TOKEN = process.env.PARTICLE_ACCESS_TOKEN;
const PARTICLE_DEVICE_ID = process.env.PARTICLE_DEVICE_ID;
const PARTICLE_EVENT_NAME = "environmentData";
const PARTICLE_STREAM_URL = `https://api.particle.io/v1/devices/events/${PARTICLE_EVENT_NAME}?access_token=${PARTICLE_ACCESS_TOKEN}`;

// Validate environment variables
if (!PARTICLE_ACCESS_TOKEN || !PARTICLE_DEVICE_ID) {
    console.error("Error: Missing Particle API credentials in environment variables.");
    process.exit(1);
}

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

                    latestData.temperature = eventData.temperature;
                    latestData.humidity = eventData.humidity;

                    console.log("Updated Data:", latestData);

                    io.emit("update", latestData);

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

// Serve static files for the dashboard
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Mushroom Box Dashboard Backend is Running!");
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
console.log(`PORT environment variable: ${process.env.PORT}`);
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
