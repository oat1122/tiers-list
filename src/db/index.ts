// src/db/index.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema/index";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "test"
    ? "mysql://root:root@127.0.0.1:3306/test"
    : undefined);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const connection = mysql.createPool(databaseUrl);

export const db = drizzle(connection, { schema, mode: "default" });
