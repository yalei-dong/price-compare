"use client";

import { useLocale } from "@/context/LocaleContext";
import { t } from "@/lib/i18n";
import { useCallback } from "react";

/** Returns a translate function `t(key, params?)` bound to the user's detected language. */
export function useTranslation() {
  const { lang } = useLocale();

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => t(lang, key, params),
    [lang]
  );

  return translate;
}
