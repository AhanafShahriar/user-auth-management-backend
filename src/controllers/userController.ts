import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import dotenv from "dotenv";

dotenv.config();

const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Error registering user" });
  }
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
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
      await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
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
  const placeholders = userIds.map(() => "?").join(",");
  try {
    const [result]: any = await pool.query(
      `UPDATE users SET status = 'blocked' WHERE id IN (${placeholders})`,
      userIds
    );

    res.json({ message: "Users blocked successfully", result });
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
  const placeholders = userIds.map(() => "?").join(",");
  try {
    const [result]: any = await pool.query(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      userIds
    );
    res.json({ message: "Users deleted successfully", result });
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
  const placeholders = userIds.map(() => "?").join(",");
  try {
    const [result]: any = await pool.query(
      `UPDATE users SET status = 'active' WHERE id IN (${placeholders})`,
      userIds
    );
    res.json({ message: "Users unblocked successfully", result });
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
    const [rows]: any = await pool.query("SELECT * FROM users");
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
