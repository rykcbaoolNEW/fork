const fs = require("fs");
const { CADDY_FILE, PORT_APP } = require("./config");

function generateCaddy(domains) {
    let config = `
{
    email rykcbaool@gmail.com
}
`;

    config += `
:80 {
    reverse_proxy localhost:${PORT_APP}
}
`;

    for (const d of domains) {
        config += `
${d} {
    reverse_proxy localhost:${PORT_APP}
}
`;
    }

    return config;
}

function writeCaddy(domains) {
    fs.writeFileSync(CADDY_FILE, generateCaddy(domains));
}

module.exports = { writeCaddy };
