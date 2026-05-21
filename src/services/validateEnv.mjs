import { z } from "zod";

const envSchema = z.object({
  DEMO_MODE: z.enum(["true", "false"]).default("false"),
  ENABLED_DATA_SOURCES: z.string().default("WhatsApp,Facebook,Instagram,IMessage"),
  DONOR_ID_INPUT_METHOD: z.enum(["automated", "showid", "manually"]),
  DONOR_SURVEY_ENABLED: z.enum(["true", "false"]).transform(val => val === "true"),
  FEEDBACK_SURVEY_ENABLED: z.enum(["true", "false"]).transform(val => val === "true"),
  DONOR_SURVEY_LINK: z.string().url(),
  FEEDBACK_SURVEY_LINK: z.string().url()
});

export const validateEnv = () => {
  try {
    // Docker/Compose can inject empty strings for unset variables (e.g., DEMO_MODE="").
    // Treat empty strings as undefined so zod defaults can be applied.
    const normalizedEnv = Object.fromEntries(
      Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value])
    );

    const parsedEnv = envSchema.parse(normalizedEnv);

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
