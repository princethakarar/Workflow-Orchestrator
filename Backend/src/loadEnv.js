import dotenv from "dotenv";

// Single canonical dotenv.config() call for the whole server. Must be
// imported FIRST in index.js (before any other import) — ES module imports
// fully execute in the order they're declared, so this guarantees env vars
// are loaded before any other module's top-level code runs, without relying
// on a plain statement placed "early" in index.js (which would NOT actually
// run before other imported modules, since imports are hoisted ahead of a
// module's own top-level statements regardless of source order).
dotenv.config({
    path: "./.env",
});
