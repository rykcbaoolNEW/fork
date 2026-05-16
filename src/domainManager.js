import fs from "fs";
import { exec } from "child_process";

const DOMAIN_FILE = "./data/domains.json";
const CADDY_FILE = "/etc/caddy/Caddyfile";
const PORT = 1234;

function loadDomains() {
    if (!fs.existsSync(DOMAIN_FILE)) return [];
    return JSON.parse(fs.readFileSync(DOMAIN_FILE, "utf-8"));
}

function saveDomains(domains) {
    fs.writeFileSync(DOMAIN_FILE, JSON.stringify(domains, null, 2));
}

function generate(domains) {
    let out = `
{
    email rykcbaool@gmail.com
}

:80 {
    reverse_proxy localhost:${PORT}
}
`;

    for (const d of domains) {
        out += `
${d} {
    reverse_proxy localhost:${PORT}
}

www.${d} {
    reverse_proxy localhost:${PORT}
}
`;
    }

    return out;
}

function writeCaddy(domains) {
    const tmp = CADDY_FILE + ".tmp";
    fs.writeFileSync(tmp, generate(domains));
    fs.renameSync(tmp, CADDY_FILE);

    exec("systemctl reload caddy", (err) => {
        if (err) console.error("[CADDY ERROR]", err.message);
        else console.log("[CADDY] Reloaded");
    });
}

export function getDomains() {
    return loadDomains();
}

export function addDomain(domain) {
    let domains = loadDomains();

    if (!domains.includes(domain)) {
        domains.push(domain);
        saveDomains(domains);
        writeCaddy(domains);
    }

    return domains;
}

export function removeDomain(domain) {
    let domains = loadDomains().filter(d => d !== domain);
    saveDomains(domains);
    writeCaddy(domains);
    return domains;
}
