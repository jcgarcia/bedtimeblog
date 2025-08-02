import { getDbPool } from "../db.js";
import jwt from "jsonwebtoken";

export const getPosts = (req, res) => {
  (async () => {
    const pool = getDbPool();
    try {
      let q, result;
      if (req.query.cat) {
        q = "SELECT * FROM posts WHERE cat=$1";
        result = await pool.query(q, [req.query.cat]);
      } else {
        q = "SELECT * FROM posts";
        result = await pool.query(q);
      }
      await pool.end();
      return res.status(200).json(result.rows);
    } catch (err) {
      await pool.end();
      return res.status(500).send(err);
    }
  })();
};

export const getPost = (req, res) => {
  (async () => {
    const pool = getDbPool();
    try {
      const q =
        "SELECT p.id, username, title, desc, p.img, u.img AS userImg, cat, date FROM users u JOIN posts p ON u.id = p.userid WHERE p.id = $1 ";
      const result = await pool.query(q, [req.params.id]);
      await pool.end();
      return res.status(200).json(result.rows[0]);
    } catch (err) {
      await pool.end();
      return res.status(500).json(err);
    }
  })();
};

export const addPost = (req, res) => {
  (async () => {
    const pool = getDbPool();
    const token = req.cookies.access_token;
    if (!token) {
      await pool.end();
      return res.status(401).json("Not authenticated!");
    }
    jwt.verify(token, "jwtkey", async (err, userInfo) => {
      if (err) {
        await pool.end();
        return res.status(403).json("Token is not valid!");
      }
      const q =
        "INSERT INTO posts(title, postcont, img, cat, postdate, userid) VALUES ($1, $2, $3, $4, $5, $6)";
      const values = [
        req.body.title,
        req.body.desc,
        req.body.img,
        req.body.cat,
        req.body.date,
        userInfo.id,
      ];
      try {
        await pool.query(q, values);
        await pool.end();
        return res.json("Post has been created.");
      } catch (err) {
        await pool.end();
        return res.status(500).json(err);
      }
    });
  })();
};

export const deletePost = (req, res) => {
  (async () => {
    const pool = getDbPool();
    const token = req.cookies.access_token;
    if (!token) {
      await pool.end();
      return res.status(401).json("Not authenticated!");
    }
    jwt.verify(token, "jwtkey", async (err, userInfo) => {
      if (err) {
        await pool.end();
        return res.status(403).json("Token is not valid!");
      }
      const postId = req.params.id;
      const q = "DELETE FROM posts WHERE id = $1 AND uid = $2";
      try {
        await pool.query(q, [postId, userInfo.id]);
        await pool.end();
        return res.json("Post has been deleted!");
      } catch (err) {
        await pool.end();
        return res.status(403).json("You can delete only your post!");
      }
    });
  })();
};

export const updatePost = (req, res) => {
  (async () => {
    const pool = getDbPool();
    const token = req.cookies.access_token;
    if (!token) {
      await pool.end();
      return res.status(401).json("Not authenticated!");
    }
    jwt.verify(token, "jwtkey", async (err, userInfo) => {
      if (err) {
        await pool.end();
        return res.status(403).json("Token is not valid!");
      }
      const postId = req.params.id;
      const q =
        "UPDATE posts SET title=$1, desc=$2, img=$3, cat=$4 WHERE id = $5 AND uid = $6";
      const values = [req.body.title, req.body.desc, req.body.img, req.body.cat, postId, userInfo.id];
      try {
        await pool.query(q, values);
        await pool.end();
        return res.json("Post has been updated.");
      } catch (err) {
        await pool.end();
        return res.status(500).json(err);
      }
    });
  })();
};
