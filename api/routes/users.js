import express from "express";
import { getUsers, createUser, deleteUser } from "../controllers/user.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", getUsers);

// Create a new user (admin only)
router.post("/", createUser);

// Delete a user (admin only)
router.delete("/:id", deleteUser);

export default router;