const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Cho phép chạy website trong thư mục public
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const FPT_API_KEY = process.env.FPT_API_KEY;
const FPT_API_URL = process.env.FPT_API_URL;
const FPT_MODEL = process.env.FPT_MODEL;

// Kiểm tra cấu hình
if (!FPT_API_KEY) {
    console.error("❌ Chưa có FPT_API_KEY trong file .env");
}

if (!FPT_API_URL) {
    console.error("❌ Chưa có FPT_API_URL trong file .env");
}

if (!FPT_MODEL) {
    console.error("❌ Chưa có FPT_MODEL trong file .env");
}


// ===============================
// API CHAT NCB
// ===============================

app.post("/api/chat", async (req, res) => {

    try {

        const messages = Array.isArray(req.body.messages)
            ? req.body.messages
            : [];

        if (messages.length === 0) {
            return res.status(400).json({
                error: "Chưa có nội dung tin nhắn."
            });
        }

        if (!FPT_API_KEY || !FPT_API_URL || !FPT_MODEL) {
            return res.status(500).json({
                error: "Server chưa được cấu hình API FPT."
            });
        }


        // Giới hạn lịch sử gửi lên API
        const limitedMessages = messages.slice(-30);


        // System prompt cho AI NCB
        const systemMessage = {
            role: "system",
            content:
                "Bạn là NCB, một trợ lý AI thân thiện. " +
                "Luôn trả lời bằng tiếng Việt nếu người dùng không yêu cầu ngôn ngữ khác. " +
                "Trả lời rõ ràng, dễ hiểu và hữu ích."
        };


        const finalMessages = [
            systemMessage,
            ...limitedMessages
        ];


        const requestBody = {
            model: FPT_MODEL,

            messages: finalMessages,

            temperature: 0.7,

            stream: false
        };


        console.log("➡️ Gửi yêu cầu tới FPT Serverless...");


        const response = await fetch(
            FPT_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",

                    "Authorization":
                        `Bearer ${FPT_API_KEY}`
                },

                body: JSON.stringify(requestBody)
            }
        );


        const responseText = await response.text();


        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            data = {
                raw: responseText
            };
        }


        if (!response.ok) {

            console.error(
                "❌ FPT API lỗi:",
                response.status,
                data
            );

            return res.status(response.status).json({

                error:
                    data?.error?.message ||
                    data?.message ||
                    data?.raw ||
                    "FPT Serverless API trả về lỗi."

            });
        }


        console.log("✅ FPT API trả lời thành công");


        res.json(data);


    } catch (error) {

        console.error(
            "❌ SERVER ERROR:",
            error
        );

        res.status(500).json({

            error:
                "Không thể kết nối tới máy chủ AI."

        });

    }

});


// ===============================
// KIỂM TRA SERVER
// ===============================

app.get("/api/status", (req, res) => {

    res.json({

        success: true,

        ai: "NCB",

        server: "online"

    });

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log("        NCB AI SERVER");
    console.log("================================");
    console.log("");
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🤖 AI: NCB`);
    console.log("");
    console.log("================================");

});
