import fs from "fs";
import { exec } from "child_process";

const DOMAIN_FILE = "./data/domains.json";
const CADDY_FILE = "/etc/caddy/Caddyfile";
const APP_PORT = 1234;

function loadDomains() {
    if (!fs.existsSync(DOMAIN_FILE)) return [];
    return JSON.parse(fs.readFileSync(DOMAIN_FILE, "utf-8"));
}

function saveDomains(domains) {
    fs.writeFileSync(DOMAIN_FILE, JSON.stringify(domains, null, 2));
}

function generateCaddy(domains) {
    let config = `
{
    email rykcbaool@gmail.com
}

:80 {
    reverse_proxy localhost:${APP_PORT}
}
`;

    for (const d of domains) {
        config += `
${d} {
    reverse_proxy localhost:${APP_PORT}
}

www.${d} {
    reverse_proxy localhost:${APP_PORT}
}
`;
    }

    return config;
}

function reloadCaddy() {
    exec("systemctl reload caddy", (err) => {
        if (err) console.error("[CADDY RELOAD ERROR]", err.message);
        else console.log("[CADDY] Reloaded");
    });
}

function writeCaddy(domains) {
    const tmp = CADDY_FILE + ".tmp";
    fs.writeFileSync(tmp, generateCaddy(domains));
    fs.renameSync(tmp, CADDY_FILE);
    reloadCaddy();
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
