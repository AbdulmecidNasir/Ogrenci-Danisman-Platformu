import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env dosyasını doğru konumdan yükle
dotenv.config({ path: join(__dirname, '../.env') });

// .env değerlerini kontrol et
console.log('Environment variables:', {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  port: process.env.DB_PORT
});

const dbConfig = {
  user: 'sa',
  password: 'Hadicha22',
  server: 'THEONEDEVELOPER',
  database: 'OgrenciDanismanDB',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

let pool;

// Tabloları oluştur
async function createTables() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Advisors tablosu
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'advisors')
      BEGIN
        CREATE TABLE advisors (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL,
          surname NVARCHAR(100) NOT NULL,
          email NVARCHAR(100) NOT NULL,
          username NVARCHAR(50) NOT NULL UNIQUE,
          password NVARCHAR(100) NOT NULL
        )
      END
    `);

    // Students tablosu
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'students')
      BEGIN
        CREATE TABLE students (
          id INT IDENTITY(1,1) PRIMARY KEY,
          student_id NVARCHAR(20) NOT NULL UNIQUE,
          name NVARCHAR(100) NOT NULL,
          surname NVARCHAR(100) NOT NULL,
          email NVARCHAR(100) NOT NULL,
          password NVARCHAR(100) NOT NULL,
          advisor_id INT,
          FOREIGN KEY (advisor_id) REFERENCES advisors(id)
        )
      END
    `);

    // Messages tablosu
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'messages')
      BEGIN
        CREATE TABLE messages (
          id INT IDENTITY(1,1) PRIMARY KEY,
          sender_type NVARCHAR(10) NOT NULL,
          sender_id INT NOT NULL,
          receiver_id INT NOT NULL,
          content NVARCHAR(MAX) NOT NULL,
          [read] BIT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // Message Attachments tablosu
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'message_attachments')
      BEGIN
        CREATE TABLE message_attachments (
          id NVARCHAR(36) PRIMARY KEY,
          message_id INT NOT NULL,
          name NVARCHAR(255) NOT NULL,
          type NVARCHAR(50) NOT NULL,
          url NVARCHAR(MAX) NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )
      END
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
}

export default async function connectDB() {
  try {
    if (pool) {
      return pool;
    }

    console.log('Connecting to database with config:', {
      ...dbConfig,
      password: '****' // Güvenlik için şifreyi gizle
    });

    pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server successfully');

    // Tabloları oluştur
    await createTables();

    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}