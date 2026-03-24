const domainConfig = {
  hospital: {
    kicker: "Hospital Domain",
    title: "Describe your hospital or health situation",
    heroTitle: "Hospital Support",
    heroSummary: "AI-guided health and hospital situation support with emergency-aware suggestions and trusted reference shortcuts.",
    placeholder: "Example: My father has chest pain and dizziness after taking medicine, what should we do first?",
    camera: true,
    references: [
      { label: "Google Health Search", type: "Google", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " health advice hospital symptoms")}` },
      { label: "YouTube Health Videos", type: "YouTube", build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " health advice")}` },
      { label: "Nearby Hospitals", type: "Maps", build: () => "https://www.google.com/maps/search/hospitals+near+me" },
      { label: "Customer Support", type: "Call", build: () => "tel:108" }
    ]
  },
  education: {
    kicker: "Education Domain",
    title: "Ask your learning or study question",
    heroTitle: "Education Support",
    heroSummary: "Learning assistance for assignments, coding concepts, study plans, and educational problem-solving with curated learning references.",
    placeholder: "Example: I need help understanding recursion in C++ and preparing for my exam.",
    camera: false,
    references: [
      { label: "GeeksforGeeks", type: "GFG", build: (q) => `https://www.geeksforgeeks.org/?s=${encodeURIComponent(q)}` },
      { label: "W3Schools", type: "W3", build: (q) => `https://www.w3schools.com/search/search.asp?query=${encodeURIComponent(q)}` },
      { label: "ChatGPT", type: "AI", build: () => "https://chatgpt.com/" },
      { label: "Gemini", type: "AI", build: () => "https://gemini.google.com/" },
      { label: "Google Search", type: "Google", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " education tutorial")}` },
      { label: "YouTube Tutorials", type: "YouTube", build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " tutorial")}` }
    ]
  },
  work: {
    kicker: "Work Profession Domain",
    title: "Describe your workplace or professional situation",
    heroTitle: "Work Profession Support",
    heroSummary: "Professional help for office communication, productivity, planning, interviewing, and career-focused decision support.",
    placeholder: "Example: I need to prepare for a project deadline conflict and explain a delay professionally.",
    camera: false,
    references: [
      { label: "Google Search", type: "Google", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " professional advice")}` },
      { label: "YouTube Career Help", type: "YouTube", build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " career advice")}` },
      { label: "LinkedIn", type: "Career", build: () => "https://www.linkedin.com/" },
      { label: "Email Templates", type: "Guide", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " professional email template")}` }
    ]
  },
  technical: {
    kicker: "Technical Domain",
    title: "Explain your technical issue or upload a technical image",
    heroTitle: "Technical Support",
    heroSummary: "Troubleshooting support for software, hardware, coding, networks, and visual technical problems with quick research links.",
    placeholder: "Example: My laptop shows a blue screen after update and Wi-Fi is not connecting.",
    camera: true,
    references: [
      { label: "Google Tech Search", type: "Google", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " troubleshooting fix")}` },
      { label: "YouTube Fix Videos", type: "YouTube", build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " fix tutorial")}` },
      { label: "Stack Overflow", type: "Dev", build: (q) => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}` },
      { label: "GitHub Search", type: "Code", build: (q) => `https://github.com/search?q=${encodeURIComponent(q)}` }
    ]
  },
  bot: {
    kicker: "Bot Domain",
    title: "Talk naturally with the AI bot",
    heroTitle: "Bot Conversation",
    heroSummary: "Avatar-based conversational mode with expressive movement, guided replies, and a friendly AI communication experience.",
    placeholder: "Example: Talk with me about today’s stress and help me plan my next steps.",
    camera: false,
    references: [
      { label: "Google Search", type: "Google", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
      { label: "YouTube", type: "YouTube", build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
      { label: "ChatGPT", type: "AI", build: () => "https://chatgpt.com/" }
    ]
  }
};

const situationInput = document.getElementById("situationInput");
const responseOutput = document.getElementById("responseOutput");
const referenceOutput = document.getElementById("referenceOutput");
const supportOutput = document.getElementById("supportOutput");
const panelTitle = document.getElementById("panelTitle");
const domainKicker = document.getElementById("domainKicker");
const heroDomainTitle = document.getElementById("heroDomainTitle");
const heroDomainSummary = document.getElementById("heroDomainSummary");
const analyseBtn = document.getElementById("analyseBtn");
const voiceBtn = document.getElementById("voiceBtn");
const speakBtn = document.getElementById("speakBtn");
const cameraBtn = document.getElementById("cameraBtn");
const cameraPanel = document.getElementById("cameraPanel");
const cameraFeed = document.getElementById("cameraFeed");
const photoCanvas = document.getElementById("photoCanvas");
const captureBtn = document.getElementById("captureBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const analysisTag = document.getElementById("analysisTag");
const statusChip = document.getElementById("statusChip");
const botTalkBtn = document.getElementById("botTalkBtn");
const botMessage = document.getElementById("botMessage");
const avatarCore = document.getElementById("avatarCore");
const botStage = document.getElementById("botStage");
const liveNote = document.getElementById("liveNote");

let currentDomain = "hospital";
let latestResponse = "";
let latestImageInsight = "";
let mediaStream = null;
let currentMode = "google";
let latestImageDataUrl = "";
let liveAiAvailable = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

function formatLiveText(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderSupport(items) {
  if (!items.length) {
    supportOutput.innerHTML = "<p class='support-item'>Helpful next steps will appear here.</p>";
    return;
  }

  supportOutput.innerHTML = items
    .map((item) => `<p class="support-item"><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.detail)}</p>`)
    .join("");
}

function renderReferences(input) {
  const config = domainConfig[currentDomain];
  const query = input.trim() || config.heroTitle;

  referenceOutput.innerHTML = config.references
    .map((reference) => `
      <a class="reference-link" href="${reference.build(query)}" target="_blank" rel="noreferrer">
        ${escapeHtml(reference.label)}
        <span class="reference-pill">${escapeHtml(reference.type)}</span>
      </a>
    `)
    .join("");
}

function renderLiveReferences(citations, input) {
  const liveLinks = (citations || []).map((citation) => `
    <a class="reference-link" href="${citation.url}" target="_blank" rel="noreferrer">
      ${escapeHtml(citation.title)}
      <span class="reference-pill">Live</span>
    </a>
  `);

  if (liveLinks.length) {
    referenceOutput.innerHTML = liveLinks.join("");
    return;
  }

  renderReferences(input);
}

function setDomain(domain) {
  currentDomain = domain;
  const config = domainConfig[domain];
  latestResponse = "";

  document.querySelectorAll(".domain-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.domain === domain);
  });

  domainKicker.textContent = config.kicker;
  panelTitle.textContent = config.title;
  heroDomainTitle.textContent = config.heroTitle;
  heroDomainSummary.textContent = config.heroSummary;
  situationInput.placeholder = config.placeholder;
  responseOutput.textContent = "Your guided response will appear here after analysis.";
  analysisTag.textContent = "No analysis yet";
  statusChip.textContent = `${config.heroTitle} ready`;
  cameraBtn.style.display = "inline-flex";
  cameraBtn.disabled = !config.camera;
  cameraBtn.textContent = config.camera ? "Open Camera" : "Camera Unavailable";
  botTalkBtn.style.display = domain === "bot" ? "inline-flex" : "none";
  botStage.style.opacity = domain === "bot" ? "1" : "0.75";
  botMessage.textContent = "Ask anything in Bot domain and the avatar will respond with a conversational summary, guidance, and a speaking animation.";
  renderReferences("");
  renderSupport([]);
}

function updateLiveNote() {
  liveNote.textContent = liveAiAvailable
    ? "Live AI is connected and can return real-time helpful responses with current web-grounded guidance."
    : "Live AI is not connected yet. The app will use a built-in fallback until GEMINI_API_KEY is configured.";
}

function buildAnalysis(domain, input) {
  const cleanedInput = input.trim();
  const lower = cleanedInput.toLowerCase();
  const urgentHealth = /(chest pain|breathing|unconscious|bleeding|seizure|stroke|heart attack)/.test(lower);
  const config = domainConfig[domain];

  const introByDomain = {
    hospital: urgentHealth
      ? "This looks like a possibly urgent health situation, so fast action matters."
      : "This looks like a health or hospital-related situation that needs calm, structured next steps.",
    education: "This looks like a learning challenge where a clear study path and resource mix will help most.",
    work: "This appears to be a professional situation where clarity, communication, and prioritization are key.",
    technical: "This appears to be a technical problem that benefits from step-by-step diagnosis and evidence gathering.",
    bot: "This is a conversational request, so the system will respond in a more human, guided support style."
  };

  const stepsByDomain = {
    hospital: [
      urgentHealth ? "Contact local emergency support or a doctor immediately if symptoms are severe or suddenly worsening." : "Write down symptoms, timing, medicines taken, and any recent changes.",
      "Monitor warning signs such as pain increase, breathing difficulty, fever, fainting, or dehydration.",
      "Carry previous reports, prescriptions, and patient history before going to a clinic or hospital.",
      "Use the map and call references for nearby hospital support."
    ],
    education: [
      "Break the topic into smaller concepts and identify what part is confusing first.",
      "Start with a beginner-friendly explanation, then compare examples from multiple sources.",
      "Practice with one exercise, one revision note, and one video resource.",
      "Ask a follow-up question after reviewing the linked references."
    ],
    work: [
      "Define the problem clearly: people involved, deadline, impact, and what outcome you need.",
      "Prepare a short professional message explaining the issue and your proposed solution.",
      "Prioritize the highest-impact task first and set a time-bound action plan.",
      "Use the search links for templates, communication examples, or role-specific guidance."
    ],
    technical: [
      "Identify the exact error message, recent changes, and whether the problem is repeatable.",
      "Check basics first: restart, connection, permissions, updates, and logs or screenshots.",
      "Compare the issue with known solutions from search, Stack Overflow, or GitHub.",
      "Use camera analysis if the issue is visible on a device, hardware component, or screen."
    ],
    bot: [
      "Treat the request like a guided conversation and answer one concern at a time.",
      "Use the voice and speak features for a more natural experience.",
      "Ask the bot for plans, summaries, emotional support, or next-step guidance.",
      "Continue the conversation using the input box to refine the response."
    ]
  };

  const cautionByDomain = {
    hospital: urgentHealth
      ? "Emergency note: this interface is informational only and is not a substitute for licensed medical care."
      : "Health note: use this as guidance only and contact a doctor for diagnosis or treatment decisions.",
    education: "Learning note: compare multiple references and verify syllabus-specific requirements with your teacher or institution.",
    work: "Professional note: tailor advice to your company policy, industry expectations, and confidentiality needs.",
    technical: "Technical note: back up important data before applying major fixes, resets, or installations.",
    bot: "Bot note: the conversational avatar provides guidance and summaries, not verified professional judgment."
  };

  return `
    <p><strong>Situation Summary:</strong> ${escapeHtml(cleanedInput)}</p>
    <p><strong>AI Insight:</strong> ${introByDomain[domain]}</p>
    <p><strong>Suggested Path:</strong></p>
    <p>${stepsByDomain[domain].map((step, index) => `${index + 1}. ${step}`).join("<br>")}</p>
    <p><strong>Important Note:</strong> ${cautionByDomain[domain]}</p>
    <p><strong>Recommended Mode:</strong> ${config.heroTitle} with quick references, voice support, and tailored actions below.</p>
  `;
}

function buildSupportItems(domain, input) {
  const cleanedInput = input.trim() || "your request";
  const generic = [
    { title: "Search focus", detail: `Use the quick links to auto-search more details about: ${cleanedInput}.` },
    { title: "Voice support", detail: "Tap Voice Input to dictate the situation and Speak Result to hear the analysis aloud." }
  ];

  const domainSpecific = {
    hospital: [
      { title: "Hospital action", detail: "If symptoms are severe, use the phone support shortcut and go to the nearest hospital immediately." },
      { title: "Patient record", detail: "Keep age, symptoms, medicine list, and test history ready for the doctor." }
    ],
    education: [
      { title: "Study plan", detail: "Convert the answer into notes, examples, and one practice task before moving to the next topic." },
      { title: "Reference mix", detail: "Compare GeeksforGeeks, W3Schools, videos, and AI explanations for better understanding." }
    ],
    work: [
      { title: "Professional response", detail: "Prepare a calm message with the issue, impact, and your proposed resolution." },
      { title: "Career growth", detail: "Use search references for templates, project strategy, and communication improvement." }
    ],
    technical: [
      { title: "Diagnostic trail", detail: "Capture screenshots or photos of the issue, error state, or hardware setup for comparison." },
      { title: "Fix sequence", detail: "Test one change at a time so you can identify what actually solved the problem." }
    ],
    bot: [
      { title: "Conversation mode", detail: "Use short, natural prompts to keep the avatar replies focused and easy to follow." },
      { title: "Bot interaction", detail: "Press Start Bot Reply after analysing to trigger avatar animation and speech." }
    ]
  };

  return [...domainSpecific[domain], ...generic];
}

async function analyseSituation() {
  const input = situationInput.value.trim();
  if (!input && !latestImageInsight) {
    statusChip.textContent = "Add a situation first";
    responseOutput.textContent = "Please enter your situation or use the camera for image-based guidance.";
    return;
  }

  const combinedInput = latestImageInsight ? `${input || "Image-based situation"}. ${latestImageInsight}` : input;
  statusChip.textContent = liveAiAvailable ? "Getting live AI response..." : "Using built-in fallback...";

  try {
    if (!liveAiAvailable) {
      throw new Error("Live AI unavailable");
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: currentDomain,
        mode: currentMode,
        input: combinedInput,
        imageDataUrl: latestImageDataUrl
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Live AI request failed");
    }

    latestResponse = data.text.trim();
    responseOutput.innerHTML = formatLiveText(data.text);
    renderLiveReferences(data.citations, combinedInput);
    renderSupport(buildSupportItems(currentDomain, combinedInput));
    analysisTag.textContent = "Live AI result ready";
    statusChip.textContent = "Live analysis complete";

    if (currentDomain === "bot") {
      botMessage.textContent = latestResponse;
    }
    return;
  } catch (error) {
    const analysisHtml = buildAnalysis(currentDomain, combinedInput);
    latestResponse = stripHtml(analysisHtml).replace(/\s+/g, " ").trim();
    responseOutput.innerHTML = analysisHtml;
    renderReferences(combinedInput);
    renderSupport(buildSupportItems(currentDomain, combinedInput));
    analysisTag.textContent = `${domainConfig[currentDomain].heroTitle} analysed`;
    statusChip.textContent = liveAiAvailable ? "Live request failed, fallback shown" : "Fallback analysis complete";
  }

  if (currentDomain === "bot") {
    botMessage.textContent = latestResponse;
  }
}

function startVoiceInput() {
  if (!recognition) {
    statusChip.textContent = "Voice input unsupported";
    responseOutput.textContent = "Speech recognition is not supported in this browser. Try Google Chrome or Edge.";
    return;
  }

  statusChip.textContent = "Listening...";
  recognition.start();
}

function speakResult() {
  const textToSpeak = currentDomain === "bot" ? botMessage.textContent : latestResponse;
  if (!textToSpeak) {
    statusChip.textContent = "Nothing to speak";
    return;
  }

  if (!window.speechSynthesis) {
    statusChip.textContent = "Speech output unsupported";
    return;
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 1;
  utterance.pitch = 1.02;
  utterance.onstart = () => avatarCore.classList.add("talking");
  utterance.onend = () => avatarCore.classList.remove("talking");
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function openCamera() {
  if (!domainConfig[currentDomain].camera) {
    statusChip.textContent = "Camera not needed here";
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    statusChip.textContent = "Camera unsupported";
    responseOutput.textContent = "This browser does not support camera access.";
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraFeed.srcObject = mediaStream;
    cameraPanel.hidden = false;
    statusChip.textContent = "Camera is live";
  } catch (error) {
    statusChip.textContent = "Camera permission blocked";
    responseOutput.textContent = "Unable to access the camera. Please allow permission and try again.";
  }
}

function closeCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  cameraFeed.srcObject = null;
  cameraPanel.hidden = true;
  statusChip.textContent = `${domainConfig[currentDomain].heroTitle} ready`;
}

function capturePhoto() {
  if (!mediaStream) {
    statusChip.textContent = "Open camera first";
    return;
  }

  const width = cameraFeed.videoWidth || 640;
  const height = cameraFeed.videoHeight || 360;
  photoCanvas.width = width;
  photoCanvas.height = height;

  const context = photoCanvas.getContext("2d");
  context.drawImage(cameraFeed, 0, 0, width, height);
  latestImageDataUrl = photoCanvas.toDataURL("image/png");

  latestImageInsight = currentDomain === "hospital"
    ? "The captured image may show a health-related condition or medical context. Check visible symptoms, hygiene, medicine labels, injury signs, or equipment details and confirm with a medical professional."
    : "The captured image may show a device, error screen, cable setup, or hardware issue. Review visible warnings, damaged parts, ports, and on-screen error clues.";

  responseOutput.innerHTML = `
    <p><strong>Image Insight:</strong> ${escapeHtml(latestImageInsight)}</p>
    <p><strong>Next Step:</strong> Add a short description with what the image shows, then click Analyse Situation for a combined response.</p>
  `;
  analysisTag.textContent = "Image captured";
  statusChip.textContent = "Photo ready for analysis";
}

async function checkLiveStatus() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    liveAiAvailable = response.ok && data.provider === "gemini-live";
  } catch (error) {
    liveAiAvailable = false;
  }

  updateLiveNote();
}

function startBotReply() {
  if (currentDomain !== "bot") {
    statusChip.textContent = "Switch to Bot domain";
    return;
  }

  if (!latestResponse) {
    analyseSituation();
  }

  avatarCore.classList.add("talking");
  botMessage.textContent = latestResponse || "Share a message, and the bot will respond with guidance and conversation support.";

  setTimeout(() => {
    avatarCore.classList.remove("talking");
  }, 2400);

  speakResult();
}

document.getElementById("domainList").addEventListener("click", (event) => {
  const button = event.target.closest(".domain-card");
  if (!button) {
    return;
  }

  latestImageInsight = "";
  latestImageDataUrl = "";
  closeCamera();
  setDomain(button.dataset.domain);
});

analyseBtn.addEventListener("click", analyseSituation);
voiceBtn.addEventListener("click", startVoiceInput);
speakBtn.addEventListener("click", speakResult);
cameraBtn.addEventListener("click", openCamera);
captureBtn.addEventListener("click", capturePhoto);
closeCameraBtn.addEventListener("click", closeCamera);
botTalkBtn.addEventListener("click", startBotReply);

if (recognition) {
  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript;
    situationInput.value = transcript;
    statusChip.textContent = "Voice captured";
  });

  recognition.addEventListener("error", () => {
    statusChip.textContent = "Voice capture failed";
  });

  recognition.addEventListener("end", () => {
    if (statusChip.textContent === "Listening...") {
      statusChip.textContent = "Voice input stopped";
    }
  });
}

window.addEventListener("beforeunload", closeCamera);

renderReferences("");
renderSupport([]);
setDomain("hospital");
checkLiveStatus();
