import camelcaseKeys from "camelcase-keys";
import z from "zod";

process.loadEnvFile();

const schema = z.object({
    PORT: z.coerce.number().int(),
    NOTICE_GROUP: z.coerce.number().int(),
    CHAT_MODEL: z.string(),
    COMPRESS_MODEL: z.string(),
    THRESHOLD: z.coerce.number().int(),

    OPENAI_API_KEY: z.string(),
    OPENAI_BASE_URL: z.string().optional(),
    TAVILY_API_KEY: z.string()
}).transform(data => camelcaseKeys(data));

export const env = schema.parse(process.env);