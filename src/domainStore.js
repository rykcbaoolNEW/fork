const fs = require("fs");
const { DOMAIN_FILE } = require("./config");

function loadDomains() {
    try {
        if (!fs.existsSync(DOMAIN_FILE)) return [];
        const raw = fs.readFileSync(DOMAIN_FILE, "utf8");
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("loadDomains error:", e);
        return [];
    }
}

function saveDomains(domains) {
    fs.writeFileSync(DOMAIN_FILE, JSON.stringify(domains, null, 2));
}

module.exports = { loadDomains, saveDomains };
