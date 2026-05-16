import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI("AIzaSyDY2e-G01urMASe7uwTHbVU-kLlSjIhMPg");

app.post("/api/reply", async (req, res) => {
  const { review, business, rating } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Write a short warm professional Google Business review response for "${business}". Rating: ${rating} stars. Review: "${review}". Max 60 words.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Reply generated successfully!");
    res.json({ reply: text });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log("ReviewPulse AI server running on port 3001");
});