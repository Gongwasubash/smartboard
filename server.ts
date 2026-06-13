import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Check for Groq API key
if (!process.env.GROQ_API_KEY) {
  console.warn("WARNING: GROQ_API_KEY environment variable is not set. Slides generation will fail.");
}

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Some AI features might fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Groq API call helper
async function callGroqApi(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response");
  return JSON.parse(text);
}

// Build rich context block from request fields
function buildContextBlock(topicTitle: string, topicContent: string, className: string, subjectName: string, chapterTitle: string, sectionTitle: string): string {
  const parts: string[] = [];
  parts.push(`Topic: "${topicTitle}"`);
  if (className) parts.push(`Class/Grade: ${className}`);
  if (subjectName) parts.push(`Subject: ${subjectName}`);
  if (chapterTitle) parts.push(`Chapter/Unit: ${chapterTitle}`);
  if (sectionTitle) parts.push(`Section: ${sectionTitle}`);
  if (topicContent) parts.push(`Context: ${topicContent}`);
  return parts.join("\n");
}

const GROQ_TOOLS = new Set(["Slides", "MCQ", "Vocabulary", "Flashcard", "Videos"]);

// API endpoint for AI content generation
app.post("/api/generate", async (req, res) => {
  try {
    const { topicTitle, topicContent, tool, settings, className, subjectName, chapterTitle, sectionTitle } = req.body;
    
    if (!topicTitle || !topicContent || !tool) {
      return res.status(400).json({ error: "Missing required fields: topicTitle, topicContent, tool" });
    }

    const { quantity = 5, questionType = "Knowledge based", difficulty = "Medium" } = settings || {};
    const contextBlock = buildContextBlock(topicTitle, topicContent, className || "", subjectName || "", chapterTitle || "", sectionTitle || "");

    // Route core tools through Groq for quality and speed
    if (GROQ_TOOLS.has(tool)) {
      let systemPrompt = "";
      let userPrompt = "";

      switch (tool) {
        case "Slides":
          systemPrompt = "You are an expert Nepali curriculum designer creating smart-board slide presentations for school teachers. Adapt language, examples, and visuals to the given grade level.";
          userPrompt = `${contextBlock}\n\nCreate exactly ${Math.min(quantity, 8)} slides for this lesson. Each slide must have:\n- "title": a clear slide heading\n- "bullets": 2-4 key teaching points written in simple, grade-appropriate language\n- "visualCue": a specific description of what the teacher should draw, write, or display on the board (diagrams, charts, labeled drawings, etc.)\n\nMake the content pedagogically sequential: start with an introduction/warm-up, build core concepts step by step, and end with a summary or quick activity. Use local Nepali examples where relevant.`;
          break;

        case "MCQ":
          systemPrompt = `You are a skilled Nepali curriculum developer creating multiple-choice assessments. Question Type: ${questionType}. Difficulty Level: ${difficulty}. Quantity: ${quantity}. Write questions that match the cognitive level of ${className ? `Grade ${className}` : "the specified grade"} students.`;
          userPrompt = `${contextBlock}\n\nCreate exactly ${quantity} multiple-choice questions following these rules:\n1. Each question must test meaningful understanding — not just recall of trivial facts\n2. All 4 options (distractors) must be plausible yet clearly wrong for the target grade\n3. The correct answer index (0-based) must be accurate\n4. Provide a brief, student-friendly explanation of why the answer is correct\n\nQuestions should be appropriate for ${questionType} cognitive level and ${difficulty} difficulty. Use real Nepali curriculum context (local places, names, examples) wherever possible.`;
          break;

        case "Vocabulary":
          systemPrompt = `You are a language和教育 specialist creating grade-appropriate vocabulary lists for Nepali school students. Quantity: ${quantity}. Difficulty: ${difficulty}.`;
          userPrompt = `${contextBlock}\n\nExtract or create exactly ${quantity} key vocabulary words/terms from this lesson. For each entry provide:\n- "word": the term in English (with Nepali translation in parentheses if applicable)\n- "meaning": a clear, simple definition a ${className ? `Grade ${className}` : "grade-level"} student can understand\n- "example": a contextual sentence using the word in a way that relates to the lesson or everyday Nepali life\n\nFocus on terms that are essential for understanding the lesson concepts — not generic words.`;
          break;

        case "Flashcard":
          systemPrompt = `You are a study-aid creator making revision flashcards for Nepali school students. Quantity: ${quantity}.`;
          userPrompt = `${contextBlock}\n\nGenerate exactly ${quantity} flashcards. Each flashcard must have:\n- "front": a question, term, concept prompt, or riddle\n- "back": the clear answer, definition, or detailed explanation\n\nMake the cards genuinely useful for self-study: front should prompt active recall, back should give enough detail to confirm understanding. Cover the most important concepts from the lesson. Use bilingual prompts where helpful (English + Nepali).`;
          break;

        case "Videos":
          systemPrompt = "You are a NotebookLM-style curriculum video producer. Your task is to create a detailed, grounded video script that any teacher can use to record a lesson video. Every scene must reference the specific source material (textbook chapter, section, page).";
          userPrompt = `${contextBlock}\n\nCreate a complete video production script for this lesson. The output must have:\n- "title": video title including grade, subject, and chapter\n- "learningObjectives": 3-4 clear objectives for what students will learn\n- "scenes": an array of scene objects, each with:\n    - "sceneNumber": sequential number\n    - "duration": estimated duration in minutes (e.g., "2:30")\n    - "sectionTitle": the textbook section this scene covers\n    - "narration": the full narration text the teacher should speak, written in clear grade-appropriate language\n    - "visualDescription": exactly what should appear on screen (diagrams, text, animations, real-life footage)\n    - "pageRef": which textbook page(s) this scene references (e.g., "p. 45-46")\n- "totalDuration": total estimated video length (e.g., "15:00")\n- "materialsNeeded": list of physical/digital materials the teacher needs to prepare\n- "assessmentQuestions": 2-3 quick verbal check questions the teacher can ask during/after the video\n\nMake the script grounded in the actual lesson content — not generic. Include specific facts, terms, and concepts from the cited pages.`;
      }

      const result = await callGroqApi(systemPrompt, userPrompt);
      return res.json(result);
    }

    // All other tools (Mind Map, Summary, Key Points, etc.) use Gemini
    const ai = getGeminiClient();

    let systemInstruction = "";
    let userPrompt = `${contextBlock}\n\n`;
    let responseSchema: any = null;

    switch (tool) {

      case "Mind Map":
        systemInstruction = "You are a mind map generator that structures concepts into hierarchical trees.";
        userPrompt += `Analyze this topic and output a tree-like mental map structure representing the primary themes, sub-concepts, and details. Adapt the depth and language to the specified grade level.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            root: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Central topic name" },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING }
                          },
                          required: ["name"]
                        }
                      }
                    },
                    required: ["name", "description"]
                  }
                }
              },
              required: ["name", "children"]
            }
          },
          required: ["root"]
        };
        break;

      default:
        // Miscellaneous tools like "Summary", "Key Points", "Group Activity", etc.
        systemInstruction = `You are an educational content creator specializing in producing ${tool} content for school children. Adapt to the grade level.`;
        userPrompt += `Create an engaging educational board layout for "${tool}". Output a fully detailed structured report with a title, a list of items, and simple practical guidelines appropriate for ${className ? `Grade ${className}` : "the specified grade"}.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            notesForTeachers: { type: Type.STRING, description: "Pedagogical insights and implementation rules" }
          },
          required: ["title", "items", "notesForTeachers"]
        };
        break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI content" });
  }
});

// Setup Vite Dev Server / Prod serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
