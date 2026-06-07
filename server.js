const express = require("express");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const P = require("pino");

const app = express();
app.use(express.json());

let sock;

// start whatsapp
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        if (update.connection === "open") {
            console.log("✅ WhatsApp Connected");
        }
    });
}

startWhatsApp();

// send function
async function send(phone, message) {
    try {
        await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
    } catch (err) {
        console.log(err.message);
    }
}

// upgrade
app.post("/notify-upgraded", async (req, res) => {
    const { name, email, phone, planDays } = req.body;

    await send(phone,
`🎉 Hello ${name}
Premium Activated 🎬
Email: ${email}
Plan: ${planDays} days`);

    res.json({ success: true });
});

// expiry
app.post("/notify-expiry", async (req, res) => {
    const { name, email, phone } = req.body;

    await send(phone,
`⏳ Hello ${name}
Your subscription is ending soon.
Email: ${email}
👉 Upgrade now`);

    res.json({ success: true });
});

// server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on", PORT);
});
