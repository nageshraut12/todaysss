const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4174);
const HOST = "127.0.0.1";
const ROOT = __dirname;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function dataUrlToInlinePart(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) {
    return null;
  }

  return {
    inline_data: {
      mime_type: match[1],
      data: match[2]
    }
  };
}

function buildPrompt({ domain, input, mode }) {
  const domainRules = {
    hospital: "You are a hospital and health support assistant. Give calm, practical next steps, red-flag warnings, and when to seek urgent care. Never present yourself as a doctor.",
    education: "You are an education support assistant. Explain clearly, give a study path, and recommend practical learning next steps.",
    work: "You are a professional work support assistant. Give practical, concise, career-safe advice with suggested actions or communication steps.",
    technical: "You are a technical troubleshooting assistant. Diagnose likely causes, propose ordered fixes, and mention what evidence to collect next.",
    bot: "You are a conversational assistant. Be warm, practical, and directly helpful."
  };

  const googleModeInstruction = mode === "google"
    ? "Format the answer like a grounded live support assistant: precise overview, best next steps, and useful sources."
    : "Format the answer for direct action: summary, solution steps, and useful sources.";

  return [
    domainRules[domain] || domainRules.bot,
    googleModeInstruction,
    "Use real-time web grounding when helpful.",
    "Be concrete and actionable.",
    "Focus on solving the user's situation, not giving generic theory.",
    "Prefer exact steps, specific checks, and practical recommendations.",
    "If the situation is high-risk, say so clearly and recommend professional or emergency help.",
    "Return a concise answer in plain text with these headings exactly:",
    "Overview",
    "What To Do Now",
    "Why This Helps",
    "When To Escalate",
    "Useful Sources",
    `User situation: ${input}`
  ].join("\n");
}

async function callGemini({ domain, input, mode, imageDataUrl }) {
  const textPrompt = buildPrompt({ domain, input, mode });
  const imagePart = dataUrlToInlinePart(imageDataUrl);
  const parts = imagePart ? [imagePart, { text: textPrompt }] : [{ text: textPrompt }];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{ parts }],
      tools: [{ google_search: {} }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "Gemini request failed";
    throw new Error(message);
  }

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";
  const grounding = candidate?.groundingMetadata || {};
  const citations = (grounding.groundingChunks || [])
    .map((chunk) => chunk.web || chunk.maps || null)
    .filter(Boolean)
    .map((item) => ({
      title: item.title || item.uri || "Source",
      url: item.uri || ""
    }))
    .filter((item, index, array) => item.url && array.findIndex((entry) => entry.url === item.url) === index)
    .slice(0, 8);

  return {
    text,
    searchQueries: grounding.webSearchQueries || [],
    citations
  };
}

async function serveStatic(req, res, pathname) {
  const targetPath = pathname === "/" ? "/index.html" : pathname;
  const normalized = path.normalize(path.join(ROOT, targetPath));

  if (!normalized.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(normalized, (error, file) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(normalized).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(file);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      provider: GEMINI_API_KEY ? "gemini-live" : "fallback-only",
      model: MODEL
    });
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/analyze") {
    try {
      const rawBody = await readRequestBody(req);
      const body = JSON.parse(rawBody || "{}");
      const input = String(body.input || "").trim();
      const domain = String(body.domain || "bot").trim();
      const mode = String(body.mode || "smart").trim();
      const imageDataUrl = body.imageDataUrl ? String(body.imageDataUrl) : "";

      if (!input && !imageDataUrl) {
        sendJson(res, 400, { error: "Please provide text or an image." });
        return;
      }

      if (!GEMINI_API_KEY) {
        sendJson(res, 503, {
          error: "Live AI is not configured yet. Set GEMINI_API_KEY before starting the server."
        });
        return;
      }

      const result = await callGemini({ domain, input: input || "Analyze this image and help the user.", mode, imageDataUrl });
      sendJson(res, 200, result);
      return;
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Unexpected server error" });
      return;
    }
  }

  if (req.method === "GET") {
    serveStatic(req, res, requestUrl.pathname);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(PORT, HOST, () => {
  console.log(`Smart Support System running at http://${HOST}:${PORT}`);
});
