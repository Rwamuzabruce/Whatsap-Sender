const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
app.use(express.json());

// WhatsApp CLIENT (Render safe setup)
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "/data/.wwebjs_auth"
    }),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    }
});

// QR CODE (only first time login)
client.on("qr", (qr) => {
    console.log("Scan this QR code:");
    qrcode.generate(qr, { small: true });
});

// READY EVENT
client.on("ready", () => {
    console.log("✅ WhatsApp is READY");
});

client.initialize();


// 🔧 helper function
async function sendMessage(phone, message) {
    try {
        await client.sendMessage(`${phone}@c.us`, message);
        return true;
    } catch (err) {
        console.log("Send error:", err.message);
        return false;
    }
}

//
// 1. UPGRADE NOTIFICATION
//
app.post("/notify-upgraded", async (req, res) => {
    const { name, email, phone, planDays } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    const message =
`🎉 Hello ${name},

Your CULLO Movies Premium is now ACTIVE.

📧 Email: ${email}
⏳ Duration: ${planDays} days

Enjoy unlimited movies 🎬🍿`;

    await sendMessage(phone, message);

    res.json({
        success: true,
        type: "upgrade-sent"
    });
});

//
// 2. EXPIRY NOTIFICATION
//
app.post("/notify-expiry", async (req, res) => {
    const { name, email, phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    const message =
`⏳ Hello ${name},

Your CULLO Movies Premium is ending soon.

📧 Email: ${email}

⚠️ Your subscription will expire soon.
👉 Upgrade now to continue watching movies 🎬`;

    await sendMessage(phone, message);

    res.json({
        success: true,
        type: "expiry-sent"
    });
});


// START SERVER
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
