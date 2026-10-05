import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

// KI-Anbindung (Vercel AI SDK + OpenAI). Der Schlüssel kommt ausschließlich aus der Umgebungsvariable
// OPENAI_API_KEY (lokal .env.local, bei Vercel unter Environment Variables), nie aus dem Code.
// Fehlt der Schlüssel, läuft alles wie bisher regelbasiert weiter.
export const AI_MODEL_ID = "gpt-4o-mini";

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getModel() {
  return openai(AI_MODEL_ID);
}

// Auswertung nach dem Gespräch (Werte-Tags, Match-Begründung): Claude Sonnet 5.5 über ANTHROPIC_API_KEY.
// Fehlt der Schlüssel, wird nicht ausgewertet, das Matching läuft dann nur mit den Basis-Antworten.
export const EVAL_MODEL_ID = "claude-sonnet-5-5";

export function isEvalAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getEvalModel() {
  return anthropic(EVAL_MODEL_ID);
}

// Kostenbremse: höchstens so viele KI-Aufrufe pro Tag und Server-Instanz (grobe Obergrenze gegen Missbrauch).
// Danach antworten Chat und Copilot regelbasiert, bis der Tag wechselt.
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 3000);
let day = "";
let used = 0;

export function takeAiBudget(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    used = 0;
  }
  if (used >= DAILY_LIMIT) return false;
  used += 1;
  return true;
}
