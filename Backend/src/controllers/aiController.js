import { Project } from "../models/projectModel.js";
import { Task } from "../models/Task.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ── RAG service config ──────────────────────────────────────────────────────
let RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://127.0.0.1:5001/rag";

// Ensure the URL ends with /rag (handles cases where only the base domain is provided)
if (RAG_SERVICE_URL && !RAG_SERVICE_URL.endsWith("/rag")) {
    RAG_SERVICE_URL = RAG_SERVICE_URL.replace(/\/$/, "") + "/rag";
}
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
/**
 * validateLlmResponse
 * Basic schema validation for the AI response.
 */
function validateLlmResponse(data) {
    if (!data.modules || !Array.isArray(data.modules)) return false;
    if (data.modules.length === 0) return false;

    for (const mod of data.modules) {
        if (!mod.name || !mod.tasks || !Array.isArray(mod.tasks)) return false;
        for (const t of mod.tasks) {
            if (!t.task || !t.subtasks || !Array.isArray(t.subtasks)) return false;
            if (t.subtasks.length < 1) return false; // Basic check, though prompt asks for 3
        }
    }
    return true;
}

/**
 * logToDataset
 * Appends a (context, response) pair to a JSONL file for fine-tuning.
 */
async function logToDataset(context, query, response) {
    try {
        const datasetDir = path.join(__dirname, "../../datasets");
        await fs.mkdir(datasetDir, { recursive: true });
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            context: context.substring(0, 5000), // Cap context size
            query,
            response
        };

        await fs.appendFile(
            path.join(datasetDir, "fine_tuning_dataset.jsonl"),
            JSON.stringify(logEntry) + "\n"
        );
    } catch (err) {
        console.error("Dataset logging failed:", err.message);
    }
}

/**
 * callRagService
 * Sends the PDF buffer to the Python RAG microservice.
 * Returns { chunks: string[], text_snippet: string, total_chunks: number }
 *
 * Uses Node 18+ native globals: FormData, Blob, fetch (no extra deps needed).
 */
async function callRagService(fileBuffer, filename, query) {
    // Node 18+ has FormData, Blob, and fetch as globals.
    const formData = new FormData();

    // Wrap the Buffer in a Blob so FormData treats it as a file field.
    const blob = new Blob([fileBuffer], { type: "application/pdf" });
    formData.append("file", blob, filename || "upload.pdf");
    formData.append("query", query || "Generate tasks from this project document");

    const response = await fetch(RAG_SERVICE_URL, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type manually — fetch adds the correct multipart boundary.
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`RAG service error ${response.status}: ${errText}`);
    }

    return response.json();
}

// ── Main controller ─────────────────────────────────────────────────────────
export const uploadAndProcessPdf = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please upload a PDF file.",
            });
        }

        const dataBuffer = req.file.buffer;
        const query = req.body.prompt || "Generate modules, tasks, subtasks, priority, and dependencies";
        const model = req.body.model || "llama3.2";
        // ── Step 1: RAG retrieval ──────────────────────────────────────────
        let ragResult;
        try {
            ragResult = await callRagService(dataBuffer, req.file.originalname, query);
        } catch (ragErr) {
            return res.status(502).json({
                success: false,
                message: "Failed to communicate with the RAG microservice.",
                details: ragErr.message,
                hint: "Check if the RAG service URL is correct and the service is healthy."
            });
        }

        const { chunks, text_snippet, total_chunks } = ragResult;

        if (!chunks || chunks.length === 0) {
            return res.status(422).json({
                success: false,
                message:
                    "The RAG service could not extract useful text from the PDF. " +
                    "The file may be image-only or corrupted.",
            });
        }

        // ── Step 2: Team context (unchanged from original) ────────────────
        let teamContextString = "No specific team context provided. Do not invent users.";
        const projectId = req.body.projectId;
        let teamData = [];

        if (
            projectId &&
            projectId !== "undefined" &&
            projectId !== "null" &&
            projectId !== "create_new"
        ) {
            const project = await Project.findById(projectId).populate(
                "team.user",
                "fullName specialization role"
            );
            if (project && project.team && project.team.length > 0) {
                for (const member of project.team) {
                    if (!member.user) continue;
                    const activeTasksCount = await Task.countDocuments({
                        assignedTo: member.user._id,
                        status: { $in: ["todo", "in-progress"] },
                    });
                    teamData.push({
                        id: member.user._id.toString(),
                        name: member.user.fullName || "Unnamed",
                        role: member.user.role,
                        specialization: member.user.specialization || "General",
                        activeTasksCount,
                    });
                }
                teamContextString =
                    "TEAM_CONTEXT (Use EXACT IDs from here for assignments):\n" +
                    JSON.stringify(teamData, null, 2);
            }
        }

        // ── Step 3: Build structured tech-lead prompt ────────────────────
        // Join retrieved chunks as the context block
        const ragContext = chunks.join("\n\n---\n\n");

        const systemPrompt = `You are a senior tech lead and software architect planning a real product build.

Your job: analyse the CONTEXT below and produce a structured, modular execution plan.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES — VIOLATING ANY RULE IS A FAILURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GROUP tasks into functional MODULES (e.g. Authentication, Backend API, Task Management, UI, DevOps).
2. Every task MUST have a minimum of 3 concrete subtasks — never return an empty array.
3. PRIORITY logic is MANDATORY — not all tasks can be the same priority:
   • "High"   → blocking core features (auth, data layer, critical backend)
   • "Medium" → important but non-blocking (dashboards, UI enhancements)
   • "Low"    → optional or polish features
4. DEPENDENCY logic — use exact task names, not IDs:
   • Authentication tasks come before any protected feature
   • Data/backend layer before dashboards or analytics
   • State management before UI rendering
   • Real-time features depend on backend readiness
5. DO NOT generate deadlines — omit the field entirely.
6. DO NOT use the word "unspecified" anywhere in the output.
7. DO NOT return empty arrays for subtasks or dependencies.
   If a task has no dependencies, use an empty array [].
8. DEDUPLICATE — merge semantically overlapping tasks before output.
9. Assign "assignedTo" using EXACT user IDs from TEAM_CONTEXT below.
   If no team context exists, omit the "assignedTo" field.
10. Output ONLY raw JSON — no explanation, no markdown, no extra text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION — CHECK BEFORE RETURNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Every task has at least 3 subtasks ✓
• Priorities are distributed across High / Medium / Low ✓
• Dependencies reference valid task names ✓
• No duplicate or semantically overlapping tasks ✓
• No "unspecified" anywhere ✓
• No deadlines ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (strict JSON only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "project_name": "name extracted from document",
  "project_summary": "one-paragraph summary of what is being built",
  "modules": [
    {
      "name": "Module Name",
      "module_description": "What this module covers",
      "tasks": [
        {
          "task": "Exact task name",
          "description": "Clear description of what needs to be done",
          "subtasks": [
            "Step 1 — specific actionable step",
            "Step 2 — specific actionable step",
            "Step 3 — specific actionable step"
          ],
          "priority": "High | Medium | Low",
          "dependencies": ["Exact task name this depends on"],
          "estimated_complexity": "Low | Medium | High",
          "suggested_role": "Frontend | Backend | Fullstack | DevOps",
          "assignedTo": "User ID from TEAM_CONTEXT (omit if no team)"
        }
      ]
    }
  ]
}
Return ONLY valid JSON.
No explanation.
No markdown.

${teamContextString}

CONTEXT (retrieved from ${total_chunks} total document chunks via semantic search):
${ragContext}

${query ? "ADDITIONAL FOCUS:\n" + query : ""}
`;

// ── Step 4: Call Ollama ───────────────────────────────────────────
    // ── Step 4: Call Groq ───────────────────────────────────────────
const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: systemPrompt,
    },
  ],
  temperature: 0.2,
});

const rawAiResponse = completion.choices[0].message.content;

// ── Step 5: Validation & Parsing ────────────────────────────────
let parsedJson = null;

try {
  let cleanJson = rawAiResponse;

  if (cleanJson.includes('```json')) {
    cleanJson = cleanJson.split('```json')[1].split('```')[0];
  } else if (cleanJson.includes('```')) {
    cleanJson = cleanJson.split('```')[1].split('```')[0];
  }

  parsedJson = JSON.parse(cleanJson.trim());
} catch (e) {
  console.error("JSON Parse Error:", e.message);
}

const isValid = parsedJson ? validateLlmResponse(parsedJson) : false;

if (!isValid) {
  return res.status(200).json({
    success: true,
    data: parsedJson,
    aiResponse: rawAiResponse,
    ragMeta: {
        totalChunks: total_chunks,
        retrievedChunks: chunks.length,
        query,
    },
  });
}
  // ── Step 6: Log & Return ───────────────────────────────────────────
  await logToDataset(ragContext, query, parsedJson);

  return res.status(200).json({
    success: true,
    data: parsedJson,
    chunks_retrieved: total_chunks,
  });
} catch (error) {
  console.error("Processing error:", error);
  next(error);
}
};
