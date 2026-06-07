const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
app.use(express.json());

/**
 * WHATSAPP CLIENT
 * - LocalAuth keeps login session
 * - /data folder required for Render persistence
 */
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

// QR LOGIN (first time only)
client.on("qr", (qr) => {
    console.log("Scan QR code below:");
    qrcode.generate(qr, { small: true });
});

// READY
client.on("ready", () => {
    console.log("✅ WhatsApp is READY");
});

// START WHATSAPP
client.initialize();


// =======================
// SEND FUNCTION
// =======================
async function sendMessage(phone, message) {
    try {
        await client.sendMessage(`${phone}@c.us`, message);
        return true;
    } catch (err) {
        console.log("Send error:", err.message);
        return false;
    }
}


// =======================
// 1. UPGRADE ENDPOINT
// =======================
app.post("/notify-upgraded", async (req, res) => {
    const { name, email, phone, planDays } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "phone required" });
    }

    const message =
`🎉 Hello ${name},

Your CULLO Movies Premium is now ACTIVE.

📧 Email: ${email}
⏳ Plan: ${planDays} days

Enjoy unlimited movies 🎬🍿`;

    await sendMessage(phone, message);

    res.json({
        success: true,
        type: "upgrade-notification"
    });
});


// =======================
// 2. EXPIRY ENDPOINT
// =======================
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
        type: "expiry-notification"
    });
});


// =======================
// TEST ROUTE
// =======================
app.get("/", (req, res) => {
    res.send("CULLO WhatsApp Server is running 🚀");
});


// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
