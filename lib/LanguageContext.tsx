"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Language, Translation, translations } from "@/lib/translations";
import { translateUi, type Vars } from "@/lib/uiText";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** true, sobald die gespeicherte Sprache gelesen wurde (vorher steht "de" als Platzhalter) */
  ready: boolean;
  t: Translation;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "dspora-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && stored in translations) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage nicht verfügbar - Standardsprache bleibt aktiv
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignorieren, wenn localStorage nicht verfügbar ist
    }
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, ready, t: translations[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Übersetzung für Oberflächen-Texte im Mitgliederbereich: tx("Deutscher Text", { name }) liefert den Text in der gewählten Sprache.
 * Fehlt eine Übersetzung, bleibt der deutsche Text stehen. Der Chat selbst (Nachrichten, Gespräch mit der KI) wird nicht übersetzt.
 */
export function useTx() {
  const { language } = useLanguage();
  return (de: string, vars?: Vars) => translateUi(de, language, vars);
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
