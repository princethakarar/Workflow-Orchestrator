import { User } from "../models/userModel.js";

/**
 * Mapping of specializations to related keywords for scoring.
 */
const SPECIALIZATION_KEYWORDS = {
    "Full Stack": ["react", "node", "express", "mongodb", "mern", "next.js", "fullstack", "javascript", "typescript"],
    "Frontend": ["react", "vue", "angular", "css", "html", "javascript", "typescript", "tailwind", "frontend", "ui", "ux"],
    "Backend": ["node", "express", "python", "django", "flask", "go", "java", "sql", "mongodb", "api", "backend", "database", "server"],
    "DevOps": ["docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "terraform", "jenkins", "linux", "devops", "cloud", "infrastructure"],
    "Mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android", "mobile", "app"],
    "QA": ["selenium", "cypress", "jest", "playwright", "testing", "automation", "qa", "quality assurance", "bug"],
    "UI/UX": ["figma", "adobe xd", "sketch", "prototyping", "user interface", "user experience", "ui", "ux", "design"]
};

/**
 * Finds the best matching project manager for a given project.
 *
 * @param {Object} projectData - Data containing project details (name, description, tasks)
 * @returns {Promise<User|null>} The best matching available project manager or null if none available.
 */
export const findBestProjectManager = async (projectData) => {
    const { name, description, tasks = [] } = projectData;

    // 1. Fetch all available project managers who are not currently managing any project
    // We look for users with role 'projectManager' and status 'available'
    const availablePMs = await User.find({
        role: 'projectManager',
        status: 'available',
        currentProjects: { $size: 0 }
    });

    if (!availablePMs || availablePMs.length === 0) {
        return null;
    }

    // 2. Consolidate project content for scoring
    const projectContent = [
        name,
        description,
        ...tasks.map(t => t.title),
        ...tasks.flatMap(t => t.subtasks || [])
    ].filter(Boolean).join(' ').toLowerCase();

    // 3. Score each available PM
    const scoredPMs = availablePMs.map(pm => {
        let score = 0;
        const spec = pm.specialization;

        if (!spec) return { pm, score: 0 };

        // Exact match: +10
        if (projectContent.includes(spec.toLowerCase())) {
            score += 10;
        }

        // Related keyword match: +5
        const keywords = SPECIALIZATION_KEYWORDS[spec] || [];
        let keywordMatch = false;
        for (const kw of keywords) {
            if (projectContent.includes(kw.toLowerCase())) {
                score += 5;
                keywordMatch = true;
            }
        }

        // If no exact match but has related keywords, we already added +5 per keyword.
        // But the prompt says "Related keyword match -> +5" (singular/category).
        // To avoid over-scoring a single specialization with many keywords,
        // we can cap keyword score at 5.
        if (keywordMatch) {
            // Reset keyword score to exactly 5 if it went higher, or just let it be.
            // Let's follow "Related keyword match -> +5" as a flat bonus for any keyword match.
            // The current loop adds 5 for EACH keyword. Let's fix that.
        }

        // Generic fallback: +1
        if (score === 0) {
            score += 1;
        }

        return { pm, score };
    });

    // Re-evaluating scoring to be strict as per requirements:
    // Exact specialization match -> +10
    // Related keyword match -> +5
    // Generic fallback -> +1

    const finalScoredPMs = availablePMs.map(pm => {
        let score = 0;
        const spec = pm.specialization;
        if (!spec) return { pm, score: 0 };

        const hasExactMatch = projectContent.includes(spec.toLowerCase());
        const keywords = SPECIALIZATION_KEYWORDS[spec] || [];
        const hasKeywordMatch = keywords.some(kw => projectContent.includes(kw.toLowerCase()));

        if (hasExactMatch) {
            score = 10;
        } else if (hasKeywordMatch) {
            score = 5;
        } else {
            score = 1;
        }

        return { pm, score };
    });

    // 4. Select PM with highest score
    finalScoredPMs.sort((a, b) => b.score - a.score);

    return finalScoredPMs[0].pm;
};
