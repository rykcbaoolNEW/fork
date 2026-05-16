import Fastify from "fastify";
import { addDomain, removeDomain } from "./byodManager.js";
import fs from "fs";

const app = Fastify();

app.get("/domains", async () => {
    return JSON.parse(fs.readFileSync("./data/domains.json"));
});

app.post("/domains", async (req, reply) => {
    const { domain } = req.body;
    if (!domain) return reply.code(400).send("Missing domain");

    addDomain(domain);
    return { success: true };
});

app.delete("/domains", async (req) => {
    const { domain } = req.body;
    removeDomain(domain);
    return { success: true };
});

app.listen({ port: 4000 }).then(() => { // there was conflict on port 3000 so moved to 4000 lol
    console.log("Dashboard running on 4000");
});
