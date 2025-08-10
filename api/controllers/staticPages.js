import { pool } from '../db.js';

// Get all static pages (for admin)
export const getAllPages = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, slug, title, meta_title, meta_description, excerpt, is_published, show_in_menu, menu_order, created_at, updated_at FROM static_pages ORDER BY menu_order ASC, title ASC'
    );

// Get active pages for menu
export const getMenuPages = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT slug, title FROM static_pages WHERE is_published = true AND show_in_menu = true ORDER BY menu_order ASC'
    );

// Get single page by slug
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      'SELECT * FROM static_pages WHERE slug = $1 AND is_published = true',
      [slug]
    );

// Get single page by ID (for editing)
export const getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM static_pages WHERE id = $1',
      [id]
    );

// Create new page
export const createPage = async (req, res) => {
  try {
    const { slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO static_pages 
       (slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order, created_by, updated_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order, userId, userId]
    );

// Update page
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE static_pages 
       SET slug = $1, title = $2, meta_title = $3, meta_description = $4, content = $5, 
           excerpt = $6, is_published = $7, show_in_menu = $8, menu_order = $9, updated_by = $10
       WHERE id = $11 
       RETURNING *`,
      [slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order, userId, id]
    );

// Delete page
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM static_pages WHERE id = $1 RETURNING *',
      [id]
    );
