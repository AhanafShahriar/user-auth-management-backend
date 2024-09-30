import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  port: parseInt(process.env.PG_PORT || "5432"), // Default PostgreSQL port is 5432
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: false, // Enable this if you are using Render or other remote DB services
  },
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err);
    return;
  }
  console.log("Connected to PostgreSQL database");
});

export default pool;
