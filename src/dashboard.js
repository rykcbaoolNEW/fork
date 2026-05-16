const express = require("express");
const { loadDomains, saveDomains } = require("./domainStore");
const { writeCaddy } = require("./caddy");
const { reloadCaddy } = require("../scripts/reloadCaddy");

const app = express();
app.use(express.json());

// get domains
app.get("/domains", (req, res) => {
    res.json(loadDomains());
});

// add domain
app.post("/domains", (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).send("Missing domain");

    let domains = loadDomains();

    if (!domains.includes(domain)) {
        domains.push(domain);
    }

    saveDomains(domains);
    writeCaddy(domains);
    reloadCaddy();

    res.send("Domain added");
});

// remove domain
app.delete("/domains", (req, res) => {
    const { domain } = req.body;

    let domains = loadDomains().filter(d => d !== domain);

    saveDomains(domains);
    writeCaddy(domains);
    reloadCaddy();

    res.send("Domain removed");
});

app.listen(2345, () => {
    console.log("Dashboard running on 2345");
});
