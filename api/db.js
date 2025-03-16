import mysql from "mysql"

export const db = mysql.createConnection({
  host:"ingasti-databases-mysql-ingasti.k.aivencloud.com",
  port:"25306",
  user:"avnadmin",
  password: process.env.DB_KEY,
  database:"blog"
})