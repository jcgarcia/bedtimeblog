import express from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/user.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", getUsers);

// Create a new user (admin only)
router.post("/", createUser);

// Update a user (admin only)
router.put("/:id", updateUser);

// Delete a user (admin only)
router.delete("/:id", deleteUser);

export default router;