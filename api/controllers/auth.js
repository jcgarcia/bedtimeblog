import { getDbPool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  //CHECK EXISTING USER
  (async () => {
    const pool = getDbPool();
    try {
      const q = "SELECT * FROM users WHERE email = $1 OR username = $2";
      const result = await pool.query(q, [req.body.email, req.body.username]);
      if (result.rows.length) {
        // Removed pool.end() to prevent closing shared pool
        return res.status(409).json("User already exists!");
      }
      //Hash the password and create a user
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);
      const q2 = "INSERT INTO users(username,email,password) VALUES ($1,$2,$3)";
      await pool.query(q2, [req.body.username, req.body.email, hash]);
      // Removed pool.end() to prevent closing shared pool
      return res.status(200).json("User has been created.");
    } catch (err) {
      // Removed pool.end() to prevent closing shared pool
      return res.status(500).json(err);
    }
  })();
};

export const login = (req, res) => {
  //CHECK USER

  (async () => {
    const pool = getDbPool();
    try {
      const q = "SELECT * FROM users WHERE username = $1";
      const result = await pool.query(q, [req.body.username]);
      if (result.rows.length === 0) {
        // Removed pool.end() to prevent closing shared pool
        return res.status(404).json("User not found!");
      }
      //Check password
      const user = result.rows[0];
      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!isPasswordCorrect) {
        // Removed pool.end() to prevent closing shared pool
        return res.status(400).json("Wrong username or password!");
      }
      const token = jwt.sign({ id: user.id }, "jwtkey");
      const { password, ...other } = user;
      // Removed pool.end() to prevent closing shared pool
      res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(200)
        .json(other);
    } catch (err) {
      // Removed pool.end() to prevent closing shared pool
      return res.status(500).json(err);
    }
  })();
};

export const logout = (req, res) => {
  res.clearCookie("access_token",{
    sameSite:"none",
    secure:true
  }).status(200).json("User has been logged out.")
};
