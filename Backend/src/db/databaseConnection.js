import mongoose from "mongoose"
import { logger } from "../utils/logger.js"

// No try/catch here: a connection failure propagates as a rejected promise
// to index.js's single connectDB().catch(...), which is the one place that
// logs and exits. Previously this function also caught, logged, and called
// process.exit(1) itself — meaning a failure here never actually reached
// the outer .catch() at all (the process was already gone), while a
// completely different failure mode (e.g. the connection attempt just
// hanging, as it would if the environment can't open a raw TCP socket)
// hit neither this catch nor the outer one, silently exiting the process
// once nothing else kept the event loop alive. One consistent handler is
// easier to reason about than two.
const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI)
    logger.info("MongoDB connected successfully")
}

export default connectDB

// --- DevPilot preview note ---
// This file is correct and does not need to change. If `npm run dev` here
// hangs at "connectDB() has not resolved" inside DevPilot's browser preview,
// that's expected: WebContainer (DevPilot's in-browser sandbox) cannot open
// raw TCP sockets, and Mongoose always needs one, regardless of which driver
// or ORM is used. This is a sandbox limitation, not a bug in this file.
//
// This Backend already runs fine in real deployment (Render — see
// Backend/.env.example's keep-alive URLs), where TCP is available.
// For DevPilot preview, only run Root/Frontend (`npm run dev`); it's
// configured via Root/Frontend/.env to call the deployed Render backend
// instead of localhost:8000. Do not try to run this Backend inside the
// WebContainer preview — no MongoDB driver will ever connect from there.
