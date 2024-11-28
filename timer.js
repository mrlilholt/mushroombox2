// timer.js

/**
 * Utility to run a function at regular intervals.
 * @param {function} callback - The function to run periodically.
 * @param {number} interval - Interval in milliseconds.
 * @returns {object} - Returns an object with a stop method.
 */
export function createTimer(callback, interval) {
    let timerId = null;
  
    function start() {
      if (timerId === null) {
        timerId = setInterval(callback, interval);
      }
    }
  
    function stop() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }
  
    // Automatically start the timer when created
    start();
  
    return {
      stop,
    };
  }
  