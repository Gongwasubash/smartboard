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

      const GROUNDING_RULE = `\n\nCRITICAL RULE: You MUST derive ALL content EXCLUSIVELY from the Context provided above. Do NOT add any facts, examples, terms, or concepts that do not appear in the Context. If the Context is insufficient for the requested quantity, generate fewer items rather than inventing external content. Every question, term, flashcard, or slide must be directly traceable to the specific chapter text provided.`;

      switch (tool) {
        case "Slides":
          systemPrompt = "You are an expert Nepali curriculum designer creating smart-board slide presentations for school teachers. Use ONLY the provided context — do not add external knowledge.";
          userPrompt = `${contextBlock}${GROUNDING_RULE}\n\nCreate exactly ${Math.min(quantity, 8)} slides based STRICTLY on the chapter text above. Each slide must have:\n- "title": a clear slide heading\n- "bullets": 2-4 key teaching points taken directly from the provided text\n- "visualCue": a specific description of what the teacher should draw, write, or display on the board (diagrams, charts, labeled drawings, etc.)\n\nMake the content pedagogically sequential: start with an introduction/warm-up, build core concepts step by step, and end with a summary or quick activity.`;
          break;

        case "MCQ":
          systemPrompt = `You are a skilled Nepali curriculum developer creating multiple-choice assessments. Use ONLY the chapter context — do not add external knowledge. Question Type: ${questionType}. Difficulty Level: ${difficulty}. Quantity: ${quantity}.`;
          userPrompt = `${contextBlock}${GROUNDING_RULE}\n\nCreate exactly ${quantity} multiple-choice questions following these rules:\n1. Every question must be based SOLELY on the chapter text above\n2. All 4 options (distractors) must be plausible yet clearly wrong based only on the chapter\n3. The correct answer index (0-based) must be accurate\n4. Provide a brief, student-friendly explanation of why the answer is correct, quoting the relevant part of the chapter\n\nQuestions should be appropriate for ${questionType} cognitive level and ${difficulty} difficulty.`;
          break;

        case "Vocabulary":
          systemPrompt = `You are a language specialist extracting vocabulary from textbook chapters. Quantity: ${quantity}. Difficulty: ${difficulty}. Extract ONLY terms that appear in the provided context.`;
          userPrompt = `${contextBlock}${GROUNDING_RULE}\n\nExtract exactly ${quantity} key vocabulary words/terms from the chapter text above. For each entry provide:\n- "word": the term exactly as it appears in the chapter\n- "meaning": a clear, simple definition based only on how the term is used in the provided text\n- "example": a contextual sentence from the chapter or derived directly from chapter content\n\nDo NOT add vocabulary from outside the chapter.`;
          break;

        case "Flashcard":
          systemPrompt = `You are a study-aid creator making revision flashcards. Quantity: ${quantity}. Base every card STRICTLY on the provided chapter context.`;
          userPrompt = `${contextBlock}${GROUNDING_RULE}\n\nGenerate exactly ${quantity} flashcards based ONLY on the chapter text above. Each flashcard must have:\n- "front": a question, term, or concept prompt taken from the chapter\n- "back": the answer or explanation as stated in the chapter\n\nMake every card directly traceable to the provided content. Do not invent concepts.`;
          break;

        case "Videos":
          systemPrompt = "You are a NotebookLM-style curriculum video producer. Your task is to create a detailed, grounded video script STRICTLY from the provided chapter text. Every scene must reference specific content from the context below. Do NOT add external information.";
          userPrompt = `${contextBlock}${GROUNDING_RULE}\n\nCreate a complete video production script based ONLY on the chapter text above. The output must have:\n- "title": video title including grade, subject, and chapter\n- "learningObjectives": 3-4 clear objectives derived from the chapter\n- "scenes": an array of scene objects, each with:\n    - "sceneNumber": sequential number\n    - "duration": estimated duration in minutes (e.g., "2:30")\n    - "sectionTitle": the textbook section this scene covers\n    - "narration": the full narration text based on the chapter content\n    - "visualDescription": exactly what should appear on screen (diagrams, text, animations)\n    - "pageRef": which part of the chapter this covers\n- "totalDuration": total estimated video length (e.g., "15:00")\n- "materialsNeeded": list of materials referenced in the chapter\n- "assessmentQuestions": 2-3 quick verbal check questions from the chapter content`;
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
        systemInstruction = "You are a mind map generator that structures concepts into hierarchical trees. Use ONLY the provided context — do not add external knowledge.";
        userPrompt += `Analyze ONLY the chapter text provided above and output a tree-like mental map structure representing the primary themes, sub-concepts, and details found in that text. Every node must be directly traceable to the provided content.`;
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
        systemInstruction = `You are an educational content creator specializing in producing ${tool} content for school children. Base your response STRICTLY on the provided chapter context — do not add external knowledge.`;
        userPrompt += `Based ONLY on the chapter text above, create an engaging educational board layout for "${tool}". Output a fully detailed structured report with a title, a list of items derived from the chapter, and simple practical guidelines appropriate for ${className ? `Grade ${className}` : "the specified grade"}. Every item must be traceable to the provided content.`;
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
