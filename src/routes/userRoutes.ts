import express from "express";
import {
  registerUser,
  loginUser,
  blockUser,
  unblockUser,
  deleteUser,
  getUsers,
} from "../controllers/userController";
import authenticate from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/block", authenticate, blockUser);
router.post("/unblock", authenticate, unblockUser);
router.post("/delete", authenticate, deleteUser);
router.get("/users", authenticate, getUsers);

export default router;
