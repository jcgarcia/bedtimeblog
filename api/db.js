import mysql from "mysql"

export const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_KEY,
  database: process.env.DB_NAME
})