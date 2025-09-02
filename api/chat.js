// api/chat.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 允许的前端来源（把你的域名都列上）
const ALLOW_ORIGINS = [
  "https://www.meteorlegends.com",
  "https://meteorlegends.com",
  "https://meteorlegends.myshopify.com" // 如名称不同请改成你的 .myshopify.com
];

function corsHeaders(origin) {
  const ok = ALLOW_ORIGINS.includes(origin);
  // 若来源匹配，则回显；否则返回主域，避免浏览器拦截
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOW_ORIGINS[0],
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const userMessage = (body?.message || "").toString().slice(0, 2000);

    const systemPrompt = [
      "You are customer support for Meteor Legends (Shopify).",
      "Reply every sentence in Chinese AND English.",
      "Be concise; for orders ask for email or order number."
    ].join(" ");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "…";
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "抱歉，服务器出错，请稍后再试。 / Sorry, server error."
    });
  }
}

