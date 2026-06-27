import { z } from "zod";

export const uiLanguageSchema = z.enum(["en", "gu", "hi"], {
  message: "Language must be English, Gujarati, or Hindi",
});