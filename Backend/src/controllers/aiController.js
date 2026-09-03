import { Project } from "../models/projectModel.js";
import { Task } from "../models/Task.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
    getRagEndpoint,
    getRagAuthHeaders,
    RAG_REQUEST_TIMEOUT_MS,
} from "../config/ragConfig.js";
// No dotenv here: src/loadEnv.js is imported first in index.js and owns the
// single canonical dotenv.config() call. No Groq client either — prompt
// construction and generation moved into the Python RAG service.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ── RAG service config ──────────────────────────────────────────────────────
// URL normalisation and auth headers live in ../config/ragConfig.js so this
// controller and the startup warm-up ping cannot drift apart.
//
// Prompt construction and the Groq call now live in the Python RAG service
// (rag_service/app.py) as an LCEL chain. This controller still owns the team
// context (it needs Mongo), response validation and dataset logging.
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
 * Sends the PDF buffer to the Python RAG microservice, which now also builds the
 * prompt and calls Groq.
 * Returns { chunks, chunk_meta, text_snippet, total_chunks, db_reused,
 *           context, response }
 *
 * Uses Node 18+ native globals: FormData, Blob, fetch (no extra deps needed).
 */
async function callRagService(fileBuffer, filename, query, teamContextString) {
    // Node 18+ has FormData, Blob, and fetch as globals.
    const formData = new FormData();

    // Wrap the Buffer in a Blob so FormData treats it as a file field.
    const blob = new Blob([fileBuffer], { type: "application/pdf" });
    formData.append("file", blob, filename || "upload.pdf");
    formData.append("query", query || "Generate tasks from this project document");
    // Computed here because it needs Mongo; passed through to Python unchanged.
    formData.append("teamContextString", teamContextString || "");

    let response;
    try {
        response = await fetch(getRagEndpoint(), {
            method: "POST",
            body: formData,
            // Only the auth header — do NOT set Content-Type manually, fetch adds
            // the correct multipart boundary.
            headers: getRagAuthHeaders(),
            // Without this the request hangs indefinitely when the RAG instance
            // is wedged, holding the Express handler open with it.
            signal: AbortSignal.timeout(RAG_REQUEST_TIMEOUT_MS),
        });
    } catch (err) {
        if (err?.name === "TimeoutError" || err?.name === "AbortError") {
            const timeoutErr = new Error(
                `RAG service did not respond within ${RAG_REQUEST_TIMEOUT_MS / 1000}s`
            );
            timeoutErr.isTimeout = true;
            throw timeoutErr;
        }
        throw err;
    }

    if (response.status === 401) {
        const authErr = new Error("RAG service rejected the shared secret");
        authErr.isAuthFailure = true;
        throw authErr;
    }

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
        const query = req.body.prompt || "Extract all important project tasks, features, modules, technical requirements, system components, user roles, workflows, and implementation details needed to build this software project from scratch. Include functional requirements, non-functional requirements, API integrations, database design, authentication, UI screens, and deployment considerations.";

        // ── Step 1: Team context (unchanged — stays in Node, it needs Mongo) ──
        // Computed before the RAG call now, because it is sent to the Python
        // service as part of the request rather than injected into a local prompt.
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

        // ── Step 2: RAG retrieval + prompt + LLM (all in the Python service) ──
        let ragResult;
        try {
            ragResult = await callRagService(
                dataBuffer,
                req.file.originalname,
                query,
                teamContextString
            );
        } catch (ragErr) {
            let message = "Failed to communicate with the RAG microservice.";
            let hint = "Check if the RAG service URL is correct and the service is healthy.";

            if (ragErr.isTimeout) {
                message = "The RAG microservice timed out.";
                hint = "It may be cold-starting on Render (model load can take ~60s). Please retry in a moment.";
            } else if (ragErr.isAuthFailure) {
                message = "The RAG microservice rejected this request.";
                hint = "RAG_SHARED_SECRET does not match between the backend and the RAG service.";
            }

            return res.status(502).json({
                success: false,
                message,
                details: ragErr.message,
                hint,
            });
        }

        // `context` is the retrieved-chunk block assembled by the Python service
        // (identical to the string Node used to build by joining chunks with a
        // blank-line/---/blank-line separator), and `response` is the raw Groq
        // completion text.
        const {
            chunks,
            text_snippet,
            total_chunks,
            context: ragContext,
            response: rawAiResponse,
        } = ragResult;

        if (!chunks || chunks.length === 0) {
            return res.status(422).json({
                success: false,
                message:
                    "The RAG service could not extract useful text from the PDF. " +
                    "The file may be image-only or corrupted.",
            });
        }

        // Prompt construction and the Groq call now happen inside the Python
        // RAG service (rag_service/app.py) as an LCEL chain: prompt | ChatGroq.
        // Everything below — fence stripping, validation, dataset logging and
        // both response shapes — is unchanged, just sourced from ragResult.

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
