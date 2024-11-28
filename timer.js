class Timer {
    constructor(task, interval) {
        this.task = task; // Task to execute
        this.interval = interval; // Interval in milliseconds
        this.timerId = null; // Stores the timer ID
    }

    start() {
        if (!this.timerId) {
            this.timerId = setInterval(this.task, this.interval);
            console.log("Timer started.");
        }
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
            console.log("Timer stopped.");
        }
    }
}

// Export Timer as a class
module.exports = Timer;
