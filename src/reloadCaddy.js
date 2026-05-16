const { exec } = require("child_process");

function reloadCaddy() {
    exec("sudo systemctl reload caddy", (err) => {
        if (err) {
            console.error("Caddy reload failed:", err.message);
        } else {
            console.log("Caddy reloaded");
        }
    });
}

module.exports = { reloadCaddy };
