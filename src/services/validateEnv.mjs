import { z } from "zod";

const supportedLanguages = ["en", "de", "hy"];

const parseLanguageList = value =>
  value
    .split(",")
    .map(lang => lang.trim())
    .filter(Boolean);

const envSchema = z.object({
  DEMO_MODE: z.enum(["true", "false"]).default("false"),
  DEMO_SHOW_HAS_TOKEN_BUTTON: z.enum(["true", "false"]).default("false"),
  DONOR_ID_INPUT_METHOD: z.enum(["automated", "showid", "manually"]),
  DONOR_SURVEY_ENABLED: z.enum(["true", "false"]).transform(val => val === "true"),
  FEEDBACK_SURVEY_ENABLED: z.enum(["true", "false"]).transform(val => val === "true"),
  DONOR_SURVEY_LINK: z.string().url(),
  FEEDBACK_SURVEY_LINK: z.string().url(),
  ENABLED_LANGUAGES: z.string().default("en,de,hy"),
  DEFAULT_LANGUAGE: z.string().default("en")
}).superRefine((env, ctx) => {
  const enabledLanguages = parseLanguageList(env.ENABLED_LANGUAGES);

  if (enabledLanguages.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENABLED_LANGUAGES"],
      message: "ENABLED_LANGUAGES must contain at least one language code"
    });
    return;
  }

  const invalidLanguages = enabledLanguages.filter(lang => !supportedLanguages.includes(lang));

  if (invalidLanguages.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENABLED_LANGUAGES"],
      message: `ENABLED_LANGUAGES contains unsupported languages: ${invalidLanguages.join(", ")}`
    });
  }

  if (!supportedLanguages.includes(env.DEFAULT_LANGUAGE)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DEFAULT_LANGUAGE"],
      message: `DEFAULT_LANGUAGE must be one of: ${supportedLanguages.join(", ")}`
    });
  }

  if (!enabledLanguages.includes(env.DEFAULT_LANGUAGE)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DEFAULT_LANGUAGE"],
      message: "DEFAULT_LANGUAGE must be included in ENABLED_LANGUAGES"
    });
  }
});

export const validateEnv = () => {
  try {
    const parsedEnv = envSchema.parse(process.env);

    // Convert non-string values to strings for Next.js compatibility
    return Object.fromEntries(Object.entries(parsedEnv).map(([key, value]) => [key, String(value)]));
  } catch (err) {
    throw new Error(
      err instanceof z.ZodError
        ? `Environment validation failed: ${err.errors.map(e => e.message).join(", ")}`
        : `Unexpected error during environment validation: ${String(err)}`
    );
  }
};
