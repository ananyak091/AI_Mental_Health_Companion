// backend/models/moodModel.js
import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    userText: { type: String, required: true },
    emotion: { type: String },
    confidence: { type: Number },
    botReply: { type: String },
    tip: { type: String },
    // optional: store whether LLM or fallback used
    source: { type: String, enum: ["groq", "fallback"], default: "groq" }
  },
  { timestamps: true }
);

const Mood = mongoose.model("Mood", moodSchema);
export default Mood;
