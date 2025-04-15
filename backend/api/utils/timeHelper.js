module.exports = function getTimeRemaining() {
    const currentTime = new Date();
    // Example: Get remaining time for night in Rust
    return currentTime.getHours() >= 18 ? "Until morning in 6 hours" : "Until night in 1 hour";
};
