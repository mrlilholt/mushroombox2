const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const cors = require("cors");

const Timer = require("./timer.js"); // Ensure this file exists and is correctly implemented

const app = express();

// Add CORS middleware
app.use(cors({
    origin: "https://mushroombox.netlify.app", // Your Netlify app URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

// Create HTTP Server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://mushroombox.netlify.app", // Match your frontend origin
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

// Periodically fetch or process data
const fetchData = () => {
    console.log("Fetching data...");
    // If you have additional fetch logic, include it here
};

// Create a timer instance
// Create a timer instance
const dataFetchTimer = new Timer(fetchData, 5000); // Use `new` with the Timer class

// Start the timer
dataFetchTimer.start();

// Example: Stop the timer after 30 seconds (optional)
setTimeout(() => {
    dataFetchTimer.stop();
}, 30000);


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

                    // Emit the latest data to all connected clients
                    io.emit("update", latestData);

                    // Handle warnings
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
app.use(express.static("public")); // Ensure `public` folder exists with assets like `index.html`

app.get("/", (req, res) => {
    res.send("Mushroom Box Dashboard Backend is Running!");
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send the latest data to the newly connected client
    if (latestData.temperature && latestData.humidity) {
        socket.emit("update", latestData);
    }

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
