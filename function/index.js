function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100));
}

function xpForNextLevel(level) {
    return Math.pow(level + 1, 2) * 100;
}

module.exports = {
    capital,
    calculateLevel,
    xpForNextLevel
};
