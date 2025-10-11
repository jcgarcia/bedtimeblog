import { getDbPool } from '../db.js';

// Emergency database schema fix for media functionality
export const fixMediaSchema = async (req, res) => {
  try {
    const pool = getDbPool();
    
    console.log('🔧 Starting database schema fix for media functionality...');
    
    // Add missing columns that the code expects (if they don't exist)
    const alterQueries = [
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS s3_key VARCHAR(512)',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS s3_bucket VARCHAR(128)', 
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS public_url TEXT',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS folder_path VARCHAR(255) DEFAULT \'/\'',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS tags TEXT[]',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS description TEXT',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_key VARCHAR(512)',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS file_type VARCHAR(100)',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS is_thumbnail BOOLEAN DEFAULT FALSE',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(512)',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE',
      'ALTER TABLE media ADD COLUMN IF NOT EXISTS caption TEXT'
    ];
    
    for (const query of alterQueries) {
      try {
        await pool.query(query);
        console.log('✅', query);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Column already exists:', query);
        } else {
          console.error('❌ Error executing:', query, error.message);
        }
      }
    }
    
    // Update existing records to populate missing fields
    const updateQuery = `
      UPDATE media SET 
        s3_key = COALESCE(NULLIF(s3_key, ''), file_path),
        s3_bucket = COALESCE(NULLIF(s3_bucket, ''), 'bedtimeblog-medialibrary'),
        folder_path = COALESCE(NULLIF(folder_path, ''), '/'),
        file_type = CASE 
          WHEN mime_type LIKE 'image/%' THEN 'image'
          WHEN mime_type LIKE 'video/%' THEN 'video' 
          WHEN mime_type LIKE 'application/pdf%' THEN 'document'
          ELSE 'file'
        END,
        is_thumbnail = COALESCE(is_thumbnail, FALSE),
        is_featured = COALESCE(is_featured, FALSE)
      WHERE s3_key IS NULL OR s3_key = '' OR file_type IS NULL OR is_thumbnail IS NULL
    `;
    
    const updateResult = await pool.query(updateQuery);
    console.log(`✅ Updated ${updateResult.rowCount} existing media records`);
    
    // Ensure media_folders table exists
    const createFoldersTable = `
      CREATE TABLE IF NOT EXISTS media_folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL UNIQUE,
        parent_id INTEGER REFERENCES media_folders(id) ON DELETE CASCADE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
      )
    `;
    
    await pool.query(createFoldersTable);
    console.log('✅ Media folders table ensured');
    
    // Insert default folders
    const insertFolders = `
      INSERT INTO media_folders (name, path, description) VALUES 
        ('Root', '/', 'Root folder for all media'),
        ('Images', '/images', 'Image files and photos'),
        ('Documents', '/documents', 'PDF and document files'),
        ('Videos', '/videos', 'Video files')
      ON CONFLICT (path) DO NOTHING
    `;
    
    const foldersResult = await pool.query(insertFolders);
    console.log(`✅ Ensured default folders exist`);
    
    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_media_folder_path ON media(folder_path)',
      'CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type)',
      'CREATE INDEX IF NOT EXISTS idx_media_is_thumbnail ON media(is_thumbnail)',
      'CREATE INDEX IF NOT EXISTS idx_media_s3_key ON media(s3_key)',
      'CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log('✅', indexQuery);
      } catch (error) {
        console.log('⚠️ Index may already exist:', indexQuery);
      }
    }
    
    // Get final schema info
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'media' 
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    
    // Get sample data to verify
    const sampleQuery = `
      SELECT id, filename, original_name, s3_key, s3_bucket, folder_path, file_type, is_thumbnail 
      FROM media 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    
    console.log('🎉 Database schema fix completed successfully!');
    
    res.json({
      success: true,
      message: 'Database schema fixed successfully',
      details: {
        columnsAdded: alterQueries.length,
        recordsUpdated: updateResult.rowCount,
        schema: schemaResult.rows,
        sampleData: sampleResult.rows
      }
    });
    
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database schema fix failed',
      error: error.message
    });
  }
};