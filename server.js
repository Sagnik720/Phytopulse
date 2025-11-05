// ===============================
// 🌿 PHYTOPULSE BACKEND — Real Plant Data + Emotion Labels
// ===============================
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const wav = require("wav-decoder");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Folder paths for real plant data
const WAV_DIR = "/mnt/c/Users/KIIT/Desktop/phytopulse-site/data/wav_files";
const LABEL_DIR = "/mnt/c/Users/KIIT/Desktop/phytopulse-site/data/emotion_labels";

// ===============================
// 🧠 Load WAV + Matching Label
// ===============================
function readWavData(filePath) {
  const buffer = fs.readFileSync(filePath);
  const decoded = wav.decode.sync(buffer);
  const samples = decoded.channelData[0];
  const voltages = samples.map(v => Math.min(5, Math.max(0, (v + 1) * 2.5)));
  return voltages;
}

function getMatchingLabel(wavFileName) {
  const base = path.basename(wavFileName, ".wav");
  const labelFile = path.join(LABEL_DIR, `${base}.json`);
  if (fs.existsSync(labelFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(labelFile, "utf-8"));
      // Try to extract the most meaningful label
      return content.emotion || content.state || content.label || "Unknown";
    } catch {
      return "Unknown";
    }
  }
  return "Unknown";
}

// Load all available files
const wavFiles = fs.readdirSync(WAV_DIR).filter(f => f.endsWith(".wav"));
let fileIndex = 0;
let sampleIndex = 0;
let currentData = readWavData(path.join(WAV_DIR, wavFiles[fileIndex]));

// ===============================
// 🌾 Generate live-like packets
// ===============================
function getNextPlantData() {
  const windowSize = 100;
  const chunk = currentData.slice(sampleIndex, sampleIndex + windowSize);
  sampleIndex += windowSize;

  if (sampleIndex + windowSize >= currentData.length) {
    fileIndex = (fileIndex + 1) % wavFiles.length;
    currentData = readWavData(path.join(WAV_DIR, wavFiles[fileIndex]));
    sampleIndex = 0;
  }

  const avgVoltage = chunk.reduce((a, b) => a + b, 0) / chunk.length;
  const moisture = Math.min(100, Math.max(10, avgVoltage * 20 + Math.random() * 10));
  const temperature = (20 + Math.random() * 10).toFixed(1);

  // 🌿 Get true scientific label from dataset
  const emotionLabel = getMatchingLabel(wavFiles[fileIndex]);

  // Convert label → meaningful state
  let predictedState = "Normal";
  let signalState = "Stable";
  let healthStatus = "Healthy";
  let emotion = "Calm";
  let alertMessage = "स्थिति सामान्य है 🌱 आपका पौधा स्वस्थ है।";

  if (emotionLabel.toLowerCase().includes("stress")) {
    predictedState = "Stress Detected";
    signalState = "Weak";
    healthStatus = "Under Stress";
    emotion = "Tense";
    alertMessage = "पौधे में तनाव का संकेत 🌿 — निगरानी आवश्यक है।";
  } else if (emotionLabel.toLowerCase().includes("light")) {
    predictedState = "Light Response";
    signalState = "Reactive";
    healthStatus = "Active";
    emotion = "Energized";
    alertMessage = "पौधा प्रकाश पर प्रतिक्रिया कर रहा है ☀️";
  } else if (emotionLabel.toLowerCase().includes("calm")) {
    predictedState = "Calm";
    signalState = "Balanced";
    healthStatus = "Healthy";
    emotion = "Peaceful";
    alertMessage = "पौधा शांत और स्वस्थ है 🌱";
  }

  return {
    plantId: "PP-REAL-001",
    signalStrength: avgVoltage.toFixed(2),
    electricalActivity: (avgVoltage / 2.5).toFixed(3),
    moisture: moisture.toFixed(1),
    temperature,
    emotion,
    signalState,
    healthStatus,
    predictedState,
    emotionLabel,
    alertMessage,
    timestamp: new Date().toLocaleTimeString(),
  };
}


// ===============================
// 🌿 API ENDPOINTS
// ===============================
app.get("/api/plant-data", (req, res) => {
  res.json(getNextPlantData());
});

// ===============================
// 🚀 RUN SERVER (Render Compatible)
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ PhytoPulse backend running on port ${PORT}`);
});
