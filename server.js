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

// ✅ Folder paths (Render-safe)
const WAV_DIR = path.join(__dirname, "data", "wav_files");
const LABEL_DIR = path.join(__dirname, "data", "json_labels");

// ===============================
// 🧠 Safe data loading (handles missing folders)
// ===============================
let wavFiles = [];
let fileIndex = 0;
let sampleIndex = 0;
let currentData = [];

try {
  if (fs.existsSync(WAV_DIR)) {
    wavFiles = fs.readdirSync(WAV_DIR).filter(f => f.endsWith(".wav"));
    if (wavFiles.length > 0) {
      currentData = readWavData(path.join(WAV_DIR, wavFiles[fileIndex]));
      console.log(`✅ Loaded ${wavFiles.length} WAV files from data folder.`);
    } else {
      console.warn("⚠️ No WAV files found — using simulated data.");
    }
  } else {
    console.warn("⚠️ Data folder not found — using simulated data.");
  }
} catch (err) {
  console.warn("⚠️ Error reading WAV files — using simulated data.", err);
}

// ===============================
// 🧠 Load WAV + Matching Label
// ===============================
function readWavData(filePath) {
  const buffer = fs.readFileSync(filePath);
  const decoded = wav.decode.sync(buffer);
  const samples = decoded.channelData[0];
  return samples.map(v => Math.min(5, Math.max(0, (v + 1) * 2.5)));
}

function getMatchingLabel(wavFileName) {
  const base = path.basename(wavFileName, ".wav");
  const labelFile = path.join(LABEL_DIR, `${base}.json`);
  if (fs.existsSync(labelFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(labelFile, "utf-8"));
      return content.emotion || content.state || content.label || "Unknown";
    } catch {
      return "Unknown";
    }
  }
  return "Unknown";
}

// ===============================
// 🌾 Generate Live-like Packets
// ===============================
function getNextPlantData() {
  if (currentData.length === 0) {
    // Simulated fallback data (for Render safety)
    return {
      plantId: "PP-SIM-001",
      signalStrength: (Math.random() * 5).toFixed(2),
      electricalActivity: (Math.random() * 2).toFixed(3),
      moisture: (50 + Math.random() * 10).toFixed(1),
      temperature: (25 + Math.random() * 5).toFixed(1),
      emotion: "Calm",
      signalState: "Stable",
      healthStatus: "Healthy",
      predictedState: "Normal",
      emotionLabel: "Simulated",
      alertMessage: "Simulated data running in Render ☁️",
      timestamp: new Date().toLocaleTimeString(),
    };
  }

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
  const emotionLabel = getMatchingLabel(wavFiles[fileIndex]);

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
