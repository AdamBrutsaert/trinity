import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		JWT_SECRET: z.string().min(32),
		PAYPAL_CLIENT_ID: z.string(),
		PAYPAL_CLIENT_SECRET: z.string(),
		PAYPAL_BASE_URL: z.url(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		JWT_SECRET: process.env.JWT_SECRET,
		PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
		PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
		PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL,
	},
	emptyStringAsUndefined: true,
});
