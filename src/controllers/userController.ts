import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import dotenv from "dotenv";

dotenv.config();

const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    res.status(201).json({ user: newUser.rows[0] });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { rows }: any = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res
        .status(403)
        .json({ message: "Your account is blocked. Please contact support." });
    }

    if (await bcrypt.compare(password, user.password)) {
      await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
        user.id,
      ]);

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });

      return res.status(200).json({
        token,
        user: { id: user.id, name: user.name, last_login: user.last_login },
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Error logging in user:", err);
    return res.status(500).json({ error: "Error logging in user" });
  }
};

const blockUser = async (req: Request, res: Response) => {
  const userIds = req.body.userIds;
  if (!Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ error: "Invalid input: user IDs should be an array." });
  }
  const placeholders = userIds.map((_, index) => `$${index + 1}`).join(",");
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET status = 'blocked' WHERE id IN (${placeholders})`,
      userIds
    );

    res.json({ message: "Users blocked successfully", rowCount });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error blocking users", error: (err as Error).message });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const userIds = req.body.userIds;
  if (!Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ error: "Invalid input: user IDs should be an array." });
  }
  const placeholders = userIds.map((_, index) => `$${index + 1}`).join(",");
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      userIds
    );
    res.json({ message: "Users deleted successfully", rowCount });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error deleting users", error: (err as Error).message });
  }
};

const unblockUser = async (req: Request, res: Response) => {
  const userIds = req.body.userIds;
  if (!Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ error: "Invalid input: user IDs should be an array." });
  }
  const placeholders = userIds.map((_, index) => `$${index + 1}`).join(",");
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET status = 'active' WHERE id IN (${placeholders})`,
      userIds
    );
    res.json({ message: "Users unblocked successfully", rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error unblocking users",
      error: (err as Error).message,
    });
  }
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const { rows }: any = await pool.query("SELECT * FROM users");
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export {
  registerUser,
  loginUser,
  blockUser,
  unblockUser,
  deleteUser,
  getUsers,
};
