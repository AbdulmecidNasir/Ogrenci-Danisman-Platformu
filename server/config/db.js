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

const config = {
  user: 'sa',
  password: 'Hadicha22',
  server: 'THEONEDEVELOPER',
  database: 'OgrenciDanismanDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const connectDB = async () => {
  try {
    if (pool) {
      console.log('Using existing database connection');
      return pool;
    }

    console.log('Attempting to connect to database...');
    pool = await sql.connect(config);
    console.log('Database connection successful');
    return pool;
  } catch (err) {
    console.error('Database connection error:', {
      message: err.message,
      code: err.code,
      state: err.state,
      class: err.class,
      lineNumber: err.lineNumber,
      stack: err.stack
    });
    throw err;
  }
};

export default connectDB;