import axios from "axios";
import Mood from "../models/moodModel.js";

const CRISIS_KEYWORDS = [
  "suicide", "kill myself", "end my life", "want to die", "hurt myself",
  "life not worth", "i can’t go on", "cant go on", "no reason to live", "hopeless"
];

const TIPS = {
  sadness: [
    "Play your favorite calm song and close your eyes for 2 minutes.",
    "Write 3 things that comfort you, no matter how small.",
    "Look outside and notice one color, one sound, and one smell."
  ],
  anger: [
    "Stretch your arms and shoulders slowly — release the tension.",
    "Sip some water and take 5 controlled breaths.",
    "Walk around your room focusing on your steps."
  ],
  fear: [
    "Ground yourself: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    "Repeat slowly: ‘I am safe. I can handle this moment.’",
    "Lightly touch something nearby and focus on its texture."
  ],
  joy: [
    "Celebrate — tell someone or note it in your gratitude list!",
    "Smile intentionally — it strengthens happy memories."
  ],
  neutral: [
    "Stand up and stretch for 30 seconds.",
    "Try noting one good thing from today."
  ]
};

const crisisMessage = () =>
  "💛 I’m really sorry you’re feeling this much pain. " +
  "You don’t have to face it alone. Please reach out to someone you trust or a free helpline nearby. " +
  "You matter, even when it doesn’t feel like it.";

const containsCrisis = (text) =>
  CRISIS_KEYWORDS.some((k) => text.toLowerCase().includes(k));

const randomTip = (emotion) => {
  const arr = TIPS[emotion] || TIPS["neutral"];
  return arr[Math.floor(Math.random() * arr.length)];
};

export const analyze = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "text is required" });

    // Crisis detection
    if (containsCrisis(text)) {
      return res.json({
        emotion: "crisis",
        reply: crisisMessage(),
        tip: "Take a slow breath — you're not alone."
      });
    }

    // Hugging Face Emotion detection
    console.log("Calling Hugging Face...");
    const hfResponse = await axios.post(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      { inputs: text },
      { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` } }
    );

    const emotion = hfResponse.data[0][0].label.toLowerCase();
    const confidence = hfResponse.data[0][0].score.toFixed(2);
    console.log("HF OK:", emotion, confidence);

    // Groq Response
    console.log("Calling Groq...");
    let reply = "";

    try {
      const groqResponse = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are a kind, empathetic AI companion for students." },
            { role: "user", content: `User feels ${emotion}: ${text}` },
            { role: "assistant", content: "Please provide a comforting message and one motivational tip." }
          ],
          max_tokens: 200,
          temperature: 0.8
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      reply = groqResponse.data.choices[0].message.content.replace(/\n+/g, " ").trim();
    } catch (err) {
      console.error("⚠️ Groq failed:", err.message);
      // fallback reply
      reply =
        "I'm really sorry you're feeling this way. Remember, emotions are temporary, and you’re doing your best. Try one small positive action — like a walk, journaling, or listening to a favorite song.";
    }

    // Return response
    const tip = randomTip(emotion);

    // Optional: save the mood entry if the request is authenticated and req.user exists
let saved = false;
try {
  if (req.user && req.user.id) {
    saved = await Mood.create({
      userId: req.user.id,
      userText: text,
      emotion,
      confidence: Number(confidence),
      botReply: reply,
      tip,
      source: reply && reply.length > 0 ? "groq" : "fallback"
    });
    // if you want to avoid returning entire doc, set saved = true
    saved = true;
  }
} catch (saveErr) {
  console.warn("Failed to save mood entry:", saveErr.message || saveErr);
  saved = false;
}

    res.json({ emotion, confidence, reply, tip, saved });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
