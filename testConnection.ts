import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      blocked BOOLEAN DEFAULT FALSE
    );

`;

(async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database");

    await client.query(createTableQuery);
    console.log("Users table created successfully");

    client.release();
  } catch (error) {
    console.error("Error connecting to PostgreSQL or creating table:", error);
  } finally {
    await pool.end();
  }
})();
