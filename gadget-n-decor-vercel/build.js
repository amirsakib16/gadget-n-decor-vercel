#!/usr/bin/env node
// build.js — Injects environment variables into static files before Vercel deploys them.
// Run automatically via the "build" script in package.json.

const fs   = require("fs");
const path = require("path");

const SHEET_URL = process.env.VITE_SHEET_URL;

if (!SHEET_URL) {
  console.error("❌  VITE_SHEET_URL is not set. Add it to your Vercel environment variables.");
  process.exit(1);
}

const TARGET = path.join(__dirname, "js", "script.js");
let src = fs.readFileSync(TARGET, "utf8");

src = src.replace(/%VITE_SHEET_URL%/g, SHEET_URL);

fs.writeFileSync(TARGET, src, "utf8");
console.log("✅  Injected VITE_SHEET_URL into js/script.js");
