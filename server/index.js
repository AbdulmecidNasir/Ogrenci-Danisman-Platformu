import express from 'express';
import sql from 'mssql';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let port = 5000;

// Uploads klasörünü oluştur
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Uploads klasörünü statik olarak sun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Orijinal dosya adını koru
    const originalName = file.originalname;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize database connection
async function initializeDatabase() {
  try {
    await connectDB();
    console.log('Database connection established');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

// Initialize database on startup
initializeDatabase();

// Routes
app.post('/api/auth/student/register', async (req, res) => {
  try {
    const { name, surname, email, studentId, password, advisorId } = req.body;
    const pool = await connectDB();
    
    await pool.request()
      .input('name', sql.VarChar, name)
      .input('surname', sql.VarChar, surname)
      .input('email', sql.VarChar, email)
      .input('studentId', sql.VarChar, studentId)
      .input('password', sql.VarChar, password)
      .input('advisorId', sql.Int, advisorId)
      .query(`
        INSERT INTO students (name, surname, email, student_id, password, advisor_id)
        VALUES (@name, @surname, @email, @studentId, @password,@advisorId)
      `);

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    console.log('Login attempt:', { username, role, passwordLength: password?.length });

    if (!username || !password || !role) {
      console.log('Missing credentials:', { username: !!username, password: !!password, role: !!role });
      return res.status(400).json({ error: 'Kullanıcı adı, şifre ve rol gereklidir' });
    }

    const pool = await connectDB();

    if (role === 'advisor') {
      // Önce sadece kullanıcı adına göre kontrol et
      const checkUser = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM advisors WHERE username = @username');

      console.log('Advisor check result:', checkUser.recordset);

      if (checkUser.recordset.length === 0) {
        console.log('Advisor not found:', username);
        return res.status(401).json({ error: 'Danışman bulunamadı' });
      }

      // Sonra şifre kontrolü yap
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .input('password', sql.VarChar, password)
        .query('SELECT * FROM advisors WHERE username = @username AND password = @password');

      console.log('Advisor login result:', result.recordset);

      if (result.recordset.length > 0) {
        const advisor = result.recordset[0];
        const response = {
          id: advisor.id,
          name: advisor.name,
          surname: advisor.surname,
          email: advisor.email,
          role: 'advisor'
        };
        console.log('Sending advisor response:', response);
        res.json(response);
      } else {
        console.log('Invalid password for advisor:', username);
        res.status(401).json({ error: 'Geçersiz şifre' });
      }
    } else {
      // Önce sadece öğrenci numarasına göre kontrol et
      const checkUser = await pool.request()
        .input('studentId', sql.VarChar, username)
        .query('SELECT * FROM students WHERE student_id = @studentId');

      console.log('Student check result:', checkUser.recordset);

      if (checkUser.recordset.length === 0) {
        console.log('Student not found:', username);
        return res.status(401).json({ error: 'Öğrenci bulunamadı' });
      }

      // Sonra şifre kontrolü yap
      const result = await pool.request()
        .input('studentId', sql.VarChar, username)
        .input('password', sql.VarChar, password)
        .query('SELECT * FROM students WHERE student_id = @studentId AND password = @password');

      console.log('Student login result:', result.recordset);

      if (result.recordset.length > 0) {
        const student = result.recordset[0];
        const response = {
          id: student.id,
          name: student.name,
          surname: student.surname,
          email: student.email,
          studentId: student.student_id,
          role: 'student'
        };
        console.log('Sending student response:', response);
        res.json(response);
      } else {
        console.log('Invalid password for student:', username);
        res.status(401).json({ error: 'Geçersiz şifre' });
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Giriş işlemi sırasında bir hata oluştu' });
  }
});

app.post('/api/setup', async (req, res) => {
  try {
    const pool = await connectDB();
    
    // Messages tablosunu oluştur
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'messages')
      BEGIN
        CREATE TABLE messages (
          id INT IDENTITY(1,1) PRIMARY KEY,
          sender_type VARCHAR(10) NOT NULL,
          sender_id INT NOT NULL,
          receiver_id INT NOT NULL,
          content TEXT NOT NULL,
          read BIT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE()
        )
      END
    `);

    res.json({ message: 'Database setup completed' });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Database setup failed' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    // Tam URL oluştur
    const baseUrl = `http://localhost:${port}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('File uploaded:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: fileUrl,
      path: req.file.path
    });

    // Dosya türünü belirle
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    }

    const response = {
      id: uuidv4(),
      name: req.file.originalname,
      type: fileType,
      url: fileUrl
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Dosya yüklenirken bir hata oluştu' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { content, sender, senderName, senderId, receiverId, attachments } = req.body;
    console.log('Received message:', { content, sender, senderName, senderId, receiverId, attachments });
    
    const pool = await connectDB();

    // Transaction başlat
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Mesajı ekle
      const messageResult = await transaction.request()
        .input('senderType', sql.VarChar, sender)
        .input('senderId', sql.Int, parseInt(senderId))
        .input('receiverId', sql.Int, parseInt(receiverId))
        .input('content', sql.Text, content)
        .query(`
          INSERT INTO messages (sender_type, sender_id, receiver_id, content, created_at)
          OUTPUT INSERTED.*
          VALUES (@senderType, @senderId, @receiverId, @content, GETDATE())
        `);

      const message = messageResult.recordset[0];

      // Eğer ekler varsa, onları da ekle
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await transaction.request()
            .input('id', sql.VarChar, attachment.id)
            .input('messageId', sql.Int, message.id)
            .input('name', sql.VarChar, attachment.name)
            .input('type', sql.VarChar, attachment.type)
            .input('url', sql.VarChar, attachment.url)
            .query(`
              INSERT INTO message_attachments (id, message_id, name, type, url)
              VALUES (@id, @messageId, @name, @type, @url)
            `);
        }
      }

      // Transaction'ı tamamla
      await transaction.commit();

      // Mesajı ve eklerini getir
      const messageWithAttachments = await pool.request()
        .input('messageId', sql.Int, message.id)
        .query(`
          SELECT 
            m.*,
            (
              SELECT 
                id, name, type, url
              FROM message_attachments
              WHERE message_id = m.id
              FOR JSON PATH
            ) as attachments
          FROM messages m
          WHERE m.id = @messageId
        `);

      const formattedMessage = {
        ...messageWithAttachments.recordset[0],
        attachments: messageWithAttachments.recordset[0].attachments ? 
          JSON.parse(messageWithAttachments.recordset[0].attachments) : [],
        timestamp: new Date(messageWithAttachments.recordset[0].created_at).toLocaleTimeString()
      };

      console.log('Sending message response:', formattedMessage);
      res.status(201).json(formattedMessage);
    } catch (err) {
      // Hata durumunda transaction'ı geri al
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu' });
  }
});

app.get('/api/advisor/:advisorId/students', async (req, res) => {
  try {
    const { advisorId } = req.params;
    console.log('Fetching students for advisor:', advisorId);
    
    const pool = await connectDB();

    // 1. Önce danışmanın var olup olmadığını kontrol et
    const advisorCheck = await pool.request()
      .input('advisorId', sql.Int, parseInt(advisorId))
      .query('SELECT id FROM advisors WHERE id = @advisorId');

    console.log('Advisor check result:', advisorCheck.recordset);

    if (advisorCheck.recordset.length === 0) {
      console.log('Advisor not found:', advisorId);
      return res.status(404).json({ error: 'Danışman bulunamadı' });
    }

    // 2. Önce mesajları olan öğrencilerin ID'lerini bul
    const studentIdsResult = await pool.request()
      .input('advisorId', sql.Int, parseInt(advisorId))
      .query(`
        SELECT DISTINCT
          CASE 
            WHEN sender_type = 'student' THEN sender_id
            ELSE receiver_id
          END as student_id
        FROM messages
        WHERE (sender_id = @advisorId OR receiver_id = @advisorId)
      `);

    console.log('Student IDs found:', studentIdsResult.recordset);

    if (studentIdsResult.recordset.length === 0) {
      console.log('No students found with messages');
      return res.json([]);
    }

    // 3. Bu ID'lere sahip öğrencilerin bilgilerini getir
    const studentIds = studentIdsResult.recordset.map(r => r.student_id);
    const studentsResult = await pool.request()
      .input('studentIds', sql.VarChar, studentIds.join(','))
      .query(`
        SELECT 
          id,
          student_id,
          name,
          surname,
          email
        FROM students
        WHERE id IN (${studentIds.join(',')})
      `);

    console.log('Students found:', studentsResult.recordset);

    // 4. Her öğrenci için son mesajı ve okunmamış mesaj sayısını getir
    const studentsWithMessages = await Promise.all(
      studentsResult.recordset.map(async (student) => {
        try {
          // Son mesajı getir
          const lastMessageResult = await pool.request()
            .input('studentId', sql.Int, student.id)
            .input('advisorId', sql.Int, parseInt(advisorId))
            .query(`
              SELECT TOP 1 
                content as last_message,
                created_at as last_message_time
              FROM messages
              WHERE (sender_id = @studentId AND receiver_id = @advisorId)
                 OR (sender_id = @advisorId AND receiver_id = @studentId)
              ORDER BY created_at DESC
            `);

          // Okunmamış mesaj sayısını getir
          const unreadCountResult = await pool.request()
            .input('studentId', sql.Int, student.id)
            .input('advisorId', sql.Int, parseInt(advisorId))
            .query(`
              SELECT COUNT(*) as unread_count
              FROM messages
              WHERE sender_id = @studentId 
                AND receiver_id = @advisorId
                AND [read] = 0
            `);

          return {
            ...student,
            last_message: lastMessageResult.recordset[0]?.last_message || null,
            last_message_time: lastMessageResult.recordset[0]?.last_message_time || null,
            unread_count: unreadCountResult.recordset[0]?.unread_count || 0
          };
        } catch (err) {
          console.error(`Error fetching messages for student ${student.id}:`, err);
          return {
            ...student,
            last_message: null,
            last_message_time: null,
            unread_count: 0
          };
        }
      })
    );

    console.log('Final students list:', studentsWithMessages);
    res.json(studentsWithMessages);
  } catch (err) {
    console.error('Error fetching advisor students:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      state: err.state,
      class: err.class,
      lineNumber: err.lineNumber,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Öğrenci listesi alınırken bir hata oluştu',
      details: err.message
    });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { studentId, advisorId } = req.query;
    console.log('Fetching messages for:', { studentId, advisorId });

    if (!studentId || !advisorId) {
      return res.status(400).json({ error: 'Öğrenci ID ve danışman ID gereklidir' });
    }

    const pool = await connectDB();

    const result = await pool.request()
      .input('studentId', sql.Int, parseInt(studentId))
      .input('advisorId', sql.Int, parseInt(advisorId))
      .query(`
        SELECT 
          m.*,
          CASE 
            WHEN m.sender_type = 'student' THEN s.name + ' ' + s.surname
            ELSE a.name + ' ' + a.surname
          END as sender_name,
          (
            SELECT 
              id, name, type, url
            FROM message_attachments
            WHERE message_id = m.id
            FOR JSON PATH
          ) as attachments
        FROM messages m
        LEFT JOIN students s ON m.sender_type = 'student' AND m.sender_id = s.id
        LEFT JOIN advisors a ON m.sender_type = 'advisor' AND m.sender_id = a.id
        WHERE (m.sender_id = @studentId AND m.receiver_id = @advisorId)
           OR (m.sender_id = @advisorId AND m.receiver_id = @studentId)
        ORDER BY m.created_at ASC
      `);

    const messages = result.recordset.map(msg => ({
      ...msg,
      attachments: msg.attachments ? JSON.parse(msg.attachments) : []
    }));

    console.log('Messages query result:', messages);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ 
      error: 'Mesajlar alınırken bir hata oluştu',
      details: err.message
    });
  }
});

app.get('/api/messages/advisor/:advisorId', async (req, res) => {
  try {
    const { advisorId } = req.params;
    const pool = await connectDB();

    const result = await pool.request()
      .input('advisorId', sql.Int, parseInt(advisorId))
      .query(`
        SELECT m.*, 
               CASE 
                 WHEN m.sender_type = 'student' THEN s.name + ' ' + s.surname
                 ELSE a.name + ' ' + a.surname
               END as sender_name
        FROM messages m
        LEFT JOIN students s ON m.sender_type = 'student' AND m.sender_id = s.id
        LEFT JOIN advisors a ON m.sender_type = 'advisor' AND m.sender_id = a.id
        WHERE m.receiver_id = @advisorId
        ORDER BY m.created_at ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mesajı okundu olarak işaretle
app.patch('/api/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const pool = await connectDB();

    const result = await pool.request()
      .input('messageId', sql.Int, parseInt(messageId))
      .query(`
        UPDATE messages
        SET read = 1
        WHERE id = @messageId
      `);

    if (result.rowsAffected[0] > 0) {
      res.json({ message: 'Message marked as read' });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Error handling for port already in use
function tryListen() {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      port++;
      tryListen();
    } else {
      console.error('Server error:', err);
    }
  });
}

tryListen();