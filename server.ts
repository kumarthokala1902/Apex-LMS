import express from "express";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "apex-secret-key";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://apex_user:your_secure_password@localhost:5432/apex",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Fallback in-memory store if DB is not available
const mockStore = {
  users: new Map(),
  tenants: new Map(),
  courses: new Map(),
  modules: new Map(),
  lessons: new Map(),
  quizzes: new Map(),
  questions: new Map(),
  options: new Map(),
  submissions: [] as any[],
  progress: [] as any[],
};

// Initialize mock data
const mockTenantId = "tenant-1";
mockStore.tenants.set(mockTenantId, { id: mockTenantId, name: "Apex Academy", subdomain: "apex", primary_color: "#000000" });
const adminHash = bcrypt.hashSync("admin123", 10);
mockStore.users.set("admin@apex.com", { id: "user-1", tenant_id: mockTenantId, email: "admin@apex.com", name: "System Admin", role: "ADMIN", password_hash: adminHash });

const initialCourses = [
  { id: "course-1", title: "Full-Stack Web Development", description: "Master modern web development from frontend to backend.", instructor_id: "user-1", thumbnail_url: "https://picsum.photos/seed/web/800/450", is_published: true, tenant_id: mockTenantId },
  { id: "course-2", title: "Advanced System Design", description: "Learn to build scalable and resilient distributed systems.", instructor_id: "user-1", thumbnail_url: "https://picsum.photos/seed/system/800/450", is_published: true, tenant_id: mockTenantId },
  { id: "course-3", title: "Cloud Architecture with AWS", description: "Design and deploy robust applications on Amazon Web Services.", instructor_id: "user-1", thumbnail_url: "https://picsum.photos/seed/cloud/800/450", is_published: true, tenant_id: mockTenantId },
  { id: "course-4", title: "Machine Learning Fundamentals", description: "Get started with data science and predictive modeling.", instructor_id: "user-1", thumbnail_url: "https://picsum.photos/seed/ml/800/450", is_published: true, tenant_id: mockTenantId }
];

initialCourses.forEach(c => mockStore.courses.set(c.id, c));

let isDbConnected = false;

async function query(text: string, params?: any[]) {
  if (isDbConnected) {
    return await pool.query(text, params);
  }
  
  // Very basic mock query logic for auth
  if (text.includes("SELECT 1")) {
    return { rows: [{ 1: 1 }] };
  }
  if (text.includes("SELECT * FROM users WHERE email = $1")) {
    const user = mockStore.users.get(params![0]);
    return { rows: user ? [user] : [] };
  }
  if (text.includes("SELECT COUNT(*) FROM tenants")) {
    return { rows: [{ count: mockStore.tenants.size.toString() }] };
  }
  if (text.includes("SELECT id, name, email, role, tenant_id FROM users")) {
    if (text.includes("WHERE id = $1")) {
      const user = Array.from(mockStore.users.values()).find((u: any) => u.id === params![0]);
      return { rows: user ? [user] : [] };
    }
    return { rows: Array.from(mockStore.users.values()).map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, tenant_id: u.tenant_id })) };
  }
  if (text.includes("INSERT INTO users")) {
    const [id, tenant_id, email, name, role, password_hash] = params!;
    const newUser = { id, tenant_id, email, name, role, password_hash };
    mockStore.users.set(email, newUser);
    return { rows: [newUser] };
  }
  if (text.includes("SELECT * FROM courses")) {
    let courses = Array.from(mockStore.courses.values());
    if (text.includes("is_published = TRUE")) {
      courses = courses.filter((c: any) => c.is_published);
    }
    return { rows: courses };
  }
  if (text.includes("INSERT INTO courses")) {
    const [id, tenant_id, title, description, instructor_id, thumbnail_url, is_published] = params!;
    const newCourse = { id, tenant_id, title, description, instructor_id, thumbnail_url, is_published };
    mockStore.courses.set(id, newCourse);
    return { rows: [newCourse] };
  }
  if (text.includes("UPDATE courses SET")) {
    const id = params![params!.length - 1];
    const existing = mockStore.courses.get(id);
    if (existing) {
      // Very crude update for mock
      const updated = { ...existing, title: params![0], description: params![1], is_published: params![2] };
      mockStore.courses.set(id, updated);
      return { rows: [updated] };
    }
    return { rows: [] };
  }
  if (text.includes("DELETE FROM courses WHERE id = $1")) {
    mockStore.courses.delete(params![0]);
    return { rows: [] };
  }
  if (text.includes("INSERT INTO modules")) {
    const [id, course_id, title, order_index] = params!;
    const newModule = { id, course_id, title, order_index };
    mockStore.modules.set(id, newModule);
    return { rows: [newModule] };
  }
  if (text.includes("INSERT INTO lessons")) {
    const [id, module_id, title, content_type, content_body, quiz_id, order_index] = params!;
    const newLesson = { id, module_id, title, content_type, content_body, quiz_id, order_index };
    mockStore.lessons.set(id, newLesson);
    return { rows: [newLesson] };
  }
  if (text.includes("SELECT * FROM modules WHERE course_id = $1")) {
    const modules = Array.from(mockStore.modules.values()).filter((m: any) => m.course_id === params![0]);
    return { rows: modules.sort((a, b) => a.order_index - b.order_index) };
  }
  if (text.includes("SELECT * FROM lessons WHERE module_id = $1")) {
    const lessons = Array.from(mockStore.lessons.values()).filter((l: any) => l.module_id === params![0]);
    return { rows: lessons.sort((a, b) => a.order_index - b.order_index) };
  }
  if (text.includes("SELECT lesson_id FROM user_progress WHERE user_id = $1 AND course_id = $2")) {
    const progress = mockStore.progress.filter(s => s.userId === params![0] && s.courseId === params![1]);
    return { rows: progress.map(p => ({ lesson_id: p.lessonId })) };
  }
  if (text.includes("INSERT INTO user_progress")) {
    const [id, user_id, course_id, lesson_id] = params!;
    mockStore.progress.push({ userId: user_id, courseId: course_id, lessonId: lesson_id });
    return { rows: [{ id }] };
  }
  if (text.includes("SELECT * FROM tenants WHERE subdomain = $1")) {
    const tenant = Array.from(mockStore.tenants.values()).find((t: any) => t.subdomain === params![0]);
    return { rows: tenant ? [tenant] : [] };
  }
  if (text.includes("SELECT * FROM quizzes WHERE id = $1")) {
    const quiz = mockStore.quizzes.get(params![0]);
    return { rows: quiz ? [quiz] : [] };
  }
  if (text.includes("INSERT INTO quizzes")) {
    const [id, title, passing_score, randomize, question_count] = params!;
    const newQuiz = { id, title, passing_score, randomize, question_count };
    mockStore.quizzes.set(id, newQuiz);
    return { rows: [newQuiz] };
  }
  if (text.includes("SELECT * FROM questions WHERE quiz_id = $1")) {
    const questions = mockStore.questions.get(params![0]) || [];
    return { rows: questions };
  }
  if (text.includes("SELECT id, text FROM question_options WHERE question_id = $1")) {
    const question = Array.from(mockStore.questions.values()).flat().find((q: any) => q.id === params![0]);
    return { rows: question ? question.options : [] };
  }

  console.warn("Mock query not implemented for:", text);
  return { rows: [] };
}

// Initialize Database Schema (PostgreSQL version)
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subdomain TEXT UNIQUE NOT NULL,
        primary_color TEXT DEFAULT '#000000',
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'LEARNER')) NOT NULL,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id),
        title TEXT NOT NULL,
        description TEXT,
        instructor_id TEXT NOT NULL REFERENCES users(id),
        thumbnail_url TEXT,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id),
        title TEXT NOT NULL,
        order_index INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        passing_score INTEGER DEFAULT 70,
        randomize BOOLEAN DEFAULT FALSE,
        question_count INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES modules(id),
        title TEXT NOT NULL,
        content_type TEXT CHECK(content_type IN ('VIDEO', 'TEXT', 'QUIZ', 'SCORM')) NOT NULL,
        content_body TEXT,
        quiz_id TEXT REFERENCES quizzes(id),
        order_index INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id),
        text TEXT NOT NULL,
        type TEXT CHECK(type IN ('MCQ', 'TF')) NOT NULL,
        points INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS question_options (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL REFERENCES questions(id),
        text TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        quiz_id TEXT NOT NULL REFERENCES quizzes(id),
        score INTEGER NOT NULL,
        passed BOOLEAN NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        course_id TEXT NOT NULL REFERENCES courses(id),
        lesson_id TEXT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id, lesson_id)
      );
    `);

    // Seed initial data if empty
    const tenantCountResult = await pool.query("SELECT COUNT(*) FROM tenants");
    if (parseInt(tenantCountResult.rows[0].count) === 0) {
      const tenantId = "tenant-1";
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, primary_color)
        VALUES ($1, $2, $3, $4)
      `, [tenantId, "Apex Academy", "apex", "#000000"]);
    }

    const userCountResult = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCountResult.rows[0].count) === 0) {
      console.log("Seeding admin user...");
      const adminPasswordHash = await bcrypt.hash("admin123", 10);
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, name, role, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ["user-1", "tenant-1", "admin@apex.com", "System Admin", "ADMIN", adminPasswordHash]);
      console.log("Admin user seeded: admin@apex.com / admin123");
    }

    const courseCountResult = await pool.query("SELECT COUNT(*) FROM courses");
    if (parseInt(courseCountResult.rows[0].count) <= 4) { // If only initial courses exist
      const newCourses = [
        {
          id: "fs-dev",
          title: "Full Stack Development",
          description: "Comprehensive guide to full stack development.",
          videos: [
            "https://www.youtube.com/watch?v=nu_pCVPKzTk",
            "https://www.youtube.com/watch?v=7CqJlxBYj-M",
            "https://www.youtube.com/watch?v=9Jk1qkK2Ggk",
            "https://www.youtube.com/watch?v=8KaJRw-rfn8"
          ]
        },
        {
          id: "devops",
          title: "DevOps Engineering",
          description: "Master DevOps tools and practices.",
          videos: [
            "https://www.youtube.com/watch?v=0yWAtQ6wYNM",
            "https://www.youtube.com/watch?v=j5Zsa_eOXeY",
            "https://www.youtube.com/watch?v=9pZ2xmsSDdo",
            "https://www.youtube.com/watch?v=1ER2qz3cZzE"
          ]
        },
        {
          id: "ml",
          title: "Machine Learning",
          description: "Learn the foundations of Machine Learning.",
          videos: [
            "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
            "https://www.youtube.com/watch?v=ukzFI9rgwfU",
            "https://www.youtube.com/watch?v=7eh4d6sabA0",
            "https://www.youtube.com/watch?v=aircAruvnKk"
          ]
        },
        {
          id: "python",
          title: "Python Programming",
          description: "Master Python from basics to advanced.",
          videos: [
            "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
            "https://www.youtube.com/watch?v=rfscVS0vtbw",
            "https://www.youtube.com/watch?v=kqtD5dpn9C8",
            "https://www.youtube.com/watch?v=YYXdXT2l-Gg"
          ]
        },
        {
          id: "ai",
          title: "Artificial Intelligence",
          description: "Explore the world of AI and Neural Networks.",
          videos: [
            "https://www.youtube.com/watch?v=JMUxmLyrhSk",
            "https://www.youtube.com/watch?v=2ePf9rue1Ao",
            "https://www.youtube.com/watch?v=ad79nYk2keg",
            "https://www.youtube.com/watch?v=5NgNicANyqM"
          ]
        },
        {
          id: "php",
          title: "PHP Development",
          description: "Build dynamic websites with PHP.",
          videos: [
            "https://www.youtube.com/watch?v=OK_JCtrrv-c",
            "https://www.youtube.com/watch?v=BUCiSSyIGGU",
            "https://www.youtube.com/watch?v=zZ6vybT1HQs",
            "https://www.youtube.com/watch?v=2eebptXfEvw"
          ]
        },
        {
          id: "frontend",
          title: "Frontend Development",
          description: "Master HTML, CSS, and JavaScript.",
          videos: [
            "https://www.youtube.com/watch?v=G3e-cpL7ofc",
            "https://www.youtube.com/watch?v=UB1O30fR-EE",
            "https://www.youtube.com/watch?v=PkZNo7MFNFg",
            "https://www.youtube.com/watch?v=W6NZfCO5SIk"
          ]
        },
        {
          id: "java",
          title: "Java Programming",
          description: "Learn Java for enterprise applications.",
          videos: [
            "https://www.youtube.com/watch?v=eIrMbAQSU34",
            "https://www.youtube.com/watch?v=grEKMHGYyns",
            "https://www.youtube.com/watch?v=UmnCZ7-9yDY",
            "https://www.youtube.com/watch?v=RRubcjpTkks"
          ]
        }
      ];

      for (const c of newCourses) {
        await pool.query(`
          INSERT INTO courses (id, tenant_id, title, description, instructor_id, thumbnail_url, is_published)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [c.id, "tenant-1", c.title, c.description, "user-1", `https://picsum.photos/seed/${c.id}/800/450`, true]);

        const moduleId = `mod-${c.id}`;
        await pool.query(`
          INSERT INTO modules (id, course_id, title, order_index)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `, [moduleId, c.id, "Course Content", 0]);

        for (let i = 0; i < c.videos.length; i++) {
          await pool.query(`
            INSERT INTO lessons (id, module_id, title, content_type, content_body, order_index)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `, [`lesson-${c.id}-${i}`, moduleId, `Lesson ${i + 1}`, "VIDEO", c.videos[i], i]);
        }
      }
    }

    const quizCountResult = await pool.query("SELECT COUNT(*) FROM quizzes");
    if (parseInt(quizCountResult.rows[0].count) === 0) {
      // Seed a sample quiz
      const quizId = 'quiz-1';
      await pool.query(`
        INSERT INTO quizzes (id, title, passing_score, randomize, question_count)
        VALUES ($1, $2, $3, $4, $5)
      `, [quizId, 'Mastering React & JavaScript Quiz', 70, true, 20]);

      const questions = [
        { text: 'What is the latest version of React as of 2024?', type: 'MCQ', options: [{t: 'React 17', c: false}, {t: 'React 18', c: false}, {t: 'React 19', c: true}] },
        { text: 'React Server Components can only run on the client.', type: 'TF', options: [{t: 'True', c: false}, {t: 'False', c: true}] },
        { text: 'Which hook is used for side effects in React?', type: 'MCQ', options: [{t: 'useState', c: false}, {t: 'useEffect', c: true}, {t: 'useContext', c: false}] },
        { text: 'What does JSX stand for?', type: 'MCQ', options: [{t: 'JavaScript XML', c: true}, {t: 'Java Syntax Extension', c: false}, {t: 'JSON XML', c: false}] },
        { text: 'Virtual DOM is faster than direct DOM manipulation in all cases.', type: 'TF', options: [{t: 'True', c: false}, {t: 'False', c: true}] },
        { text: 'Which keyword is used to define a constant in JS?', type: 'MCQ', options: [{t: 'var', c: false}, {t: 'let', c: false}, {t: 'const', c: true}] },
        { text: 'What is the purpose of useMemo?', type: 'MCQ', options: [{t: 'Memoize values', c: true}, {t: 'Memoize components', c: false}, {t: 'Trigger effects', c: false}] },
        { text: 'React is a framework, not a library.', type: 'TF', options: [{t: 'True', c: false}, {t: 'False', c: true}] },
        { text: 'What is the default port for a Vite dev server?', type: 'MCQ', options: [{t: '3000', c: false}, {t: '5173', c: true}, {t: '8080', c: false}] },
        { text: 'How do you pass data to a child component?', type: 'MCQ', options: [{t: 'State', c: false}, {t: 'Props', c: true}, {t: 'Context', c: false}] },
        { text: 'What is the spread operator in JS?', type: 'MCQ', options: [{t: '...', c: true}, {t: '&&', c: false}, {t: '||', c: false}] },
        { text: 'Arrow functions have their own "this" context.', type: 'TF', options: [{t: 'True', c: false}, {t: 'False', c: true}] },
        { text: 'Which method is used to add an element to the end of an array?', type: 'MCQ', options: [{t: 'push', c: true}, {t: 'pop', c: false}, {t: 'shift', c: false}] },
        { text: 'What is the result of typeof null?', type: 'MCQ', options: [{t: '"null"', c: false}, {t: '"object"', c: true}, {t: '"undefined"', c: false}] },
        { text: 'Promises can have three states: pending, fulfilled, and rejected.', type: 'TF', options: [{t: 'True', c: true}, {t: 'False', c: false}] },
        { text: 'What is a "closure" in JavaScript?', type: 'MCQ', options: [{t: 'A way to close a browser tab', c: false}, {t: 'A function with access to its outer scope', c: true}, {t: 'A private class method', c: false}] },
        { text: 'Which React hook is used to access the DOM directly?', type: 'MCQ', options: [{t: 'useRef', c: true}, {t: 'useMemo', c: false}, {t: 'useCallback', c: false}] },
        { text: 'JavaScript is single-threaded.', type: 'TF', options: [{t: 'True', c: true}, {t: 'False', c: false}] },
        { text: 'What is the purpose of the "key" prop in lists?', type: 'MCQ', options: [{t: 'Styling', c: false}, {t: 'Performance/Identity', c: true}, {t: 'Data binding', c: false}] },
        { text: 'Strict Mode in React helps find potential problems.', type: 'TF', options: [{t: 'True', c: true}, {t: 'False', c: false}] },
        { text: 'Which operator is used for strict equality?', type: 'MCQ', options: [{t: '==', c: false}, {t: '===', c: true}, {t: '!=', c: false}] },
      ];

      for (const q of questions) {
        const qId = randomUUID();
        await pool.query(`
          INSERT INTO questions (id, quiz_id, text, type, points)
          VALUES ($1, $2, $3, $4, $5)
        `, [qId, quizId, q.text, q.type, 1]);

        for (const opt of q.options) {
          await pool.query(`INSERT INTO question_options (id, question_id, text, is_correct) VALUES ($1, $2, $3, $4)`, [randomUUID(), qId, opt.t, opt.c]);
        }
      }
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

async function startServer() {
  console.log("Starting server...");
  
  // Test database connection
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL");
    isDbConnected = true;
    client.release();
  } catch (err: any) {
    console.error("Failed to connect to PostgreSQL:", err.message);
    console.warn("Running in MOCK MODE. Data will not persist across restarts.");
    isDbConnected = false;
  }

  if (isDbConnected) {
    await initDb();
  }
  
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      await query("SELECT 1");
      if (isDbConnected) {
        res.json({ status: "ok", database: "connected", mode: "production" });
      } else {
        res.json({ status: "ok", database: "disconnected", mode: "mock" });
      }
    } catch (err: any) {
      res.status(500).json({ status: "error", database: err.message });
    }
  });

  // Auth Endpoints
  app.post("/api/auth/signup", async (req, res) => {
    console.log(`[AUTH] Signup attempt: ${req.body.email}`);
    try {
      const { name, email, password, tenantId = 'tenant-1' } = req.body;
      
      if (!name || !email || !password) {
        console.log(`[AUTH] Signup failed: Missing fields for ${email}`);
        return res.status(400).json({ error: "Missing required fields" });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const userId = randomUUID();
      
      await query(`
        INSERT INTO users (id, tenant_id, email, name, role, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, tenantId, email, name, 'LEARNER', passwordHash]);

      const token = jwt.sign({ userId, email, role: 'LEARNER' }, JWT_SECRET);
      console.log(`[AUTH] Signup successful: ${email} (ID: ${userId})`);
      res.json({ token, user: { id: userId, name, email, role: 'LEARNER', tenant_id: tenantId } });
    } catch (err: any) {
      console.error("[AUTH] Signup error:", err);
      if (err.code === '23505') {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: `Signup failed: ${err.message}` });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    console.log(`[AUTH] Login attempt: ${req.body.email}`);
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await query("SELECT * FROM users WHERE email = $1", [email]);
      
      if (result.rows.length === 0) {
        console.log(`[AUTH] Login failed: User not found - ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];
      console.log(`[AUTH] Comparing password for ${email}. Hash exists: ${!!user.password_hash}`);
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        console.log(`[AUTH] Login failed: Invalid password for ${email}. Provided: ${password.substring(0, 2)}...`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET);
      console.log(`[AUTH] Login successful: ${email}`);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id } });
    } catch (err: any) {
      console.error("[AUTH] Login error:", err);
      res.status(500).json({ error: `Login failed: ${err.message}` });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const result = await query("SELECT id, name, email, role, tenant_id FROM users WHERE id = $1", [decoded.userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Real-time Presence & Progress Tracking
  const activeUsers = new Map();
  io.on("connection", (socket) => {
    socket.on("join", (data) => {
      activeUsers.set(socket.id, data.user);
      io.emit("presence_update", Array.from(activeUsers.values()));
    });

    socket.on("progress_update", (data) => {
      // Broadcast progress update to other admins/instructors
      socket.broadcast.emit("user_progress", data);
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      io.emit("presence_update", Array.from(activeUsers.values()));
    });
  });

  // API Routes
  app.get("/api/tenants/:subdomain", async (req, res) => {
    try {
      const result = await query("SELECT * FROM tenants WHERE subdomain = $1", [req.params.subdomain]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Tenant not found" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/courses", async (req, res) => {
    try {
      const role = req.query.role;
      let queryText = "SELECT * FROM courses";
      if (role !== 'ADMIN') {
        queryText += " WHERE is_published = TRUE";
      }
      const result = await query(queryText);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/courses/:id/content", async (req, res) => {
    try {
      const modulesResult = await query("SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index", [req.params.id]);
      const modules = modulesResult.rows;

      for (const module of modules) {
        const lessonsResult = await query("SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index", [module.id]);
        module.lessons = lessonsResult.rows.map((l: any) => ({
          ...l,
          type: l.content_type,
          content: l.content_body
        }));
      }

      res.json(modules);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const { title, description, instructor_id, tenant_id, thumbnail_url, is_published, modules } = req.body;
      const courseId = randomUUID();
      
      // Start a transaction if possible, but let's just do it sequentially for simplicity in this mock-heavy environment
      await query(`
        INSERT INTO courses (id, tenant_id, title, description, instructor_id, thumbnail_url, is_published)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [courseId, tenant_id || 'tenant-1', title || 'Untitled Course', description || '', instructor_id || 'user-1', thumbnail_url || '', is_published || false]);

      if (modules && Array.isArray(modules)) {
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          const moduleId = randomUUID();
          await query(`
            INSERT INTO modules (id, course_id, title, order_index)
            VALUES ($1, $2, $3, $4)
          `, [moduleId, courseId, module.title, i]);

          if (module.lessons && Array.isArray(module.lessons)) {
            for (let j = 0; j < module.lessons.length; j++) {
              const lesson = module.lessons[j];
              const lessonId = randomUUID();
              await query(`
                INSERT INTO lessons (id, module_id, title, content_type, content_body, quiz_id, order_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
              `, [lessonId, moduleId, lesson.title, lesson.type, lesson.content || '', lesson.quizId || null, j]);
            }
          }
        }
      }

      res.status(201).json({ id: courseId, title });
    } catch (err) {
      console.error("Course creation failed:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const { title, description, is_published } = req.body;
      const result = await query(`
        UPDATE courses SET title = $1, description = $2, is_published = $3
        WHERE id = $4
        RETURNING *
      `, [title, description, is_published, req.params.id]);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      await query("DELETE FROM courses WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/admin/quizzes", async (req, res) => {
    try {
      const { title, passing_score, randomize, question_count } = req.body;
      const id = randomUUID();
      const result = await query(`
        INSERT INTO quizzes (id, title, passing_score, randomize, question_count)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [id, title, passing_score || 70, randomize || false, question_count || 10]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const result = await query("SELECT id, name, email, role, tenant_id FROM users");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const learners = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'LEARNER'");
      const courses = await pool.query("SELECT COUNT(*) FROM courses");
      res.json({
        totalLearners: parseInt(learners.rows[0].count),
        totalCourses: parseInt(courses.rows[0].count),
        activeEnrollments: activeUsers.size,
        completionRate: "78%"
      });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Progress Endpoints
  app.get("/api/progress/:courseId", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const result = await query("SELECT lesson_id FROM user_progress WHERE user_id = $1 AND course_id = $2", [decoded.userId, req.params.courseId]);
      res.json(result.rows.map((r: any) => r.lesson_id));
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    const { userId, courseId, lessonId } = req.body;
    try {
      await query(`
        INSERT INTO user_progress (id, user_id, course_id, lesson_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, course_id, lesson_id) DO NOTHING
      `, [randomUUID(), userId, courseId, lessonId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Quiz Endpoints
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizResult = await query("SELECT * FROM quizzes WHERE id = $1", [req.params.id]);
      if (quizResult.rows.length === 0) return res.status(404).json({ error: "Quiz not found" });
      const quiz = quizResult.rows[0];

      let qQuery = "SELECT * FROM questions WHERE quiz_id = $1";
      let qParams = [quiz.id];
      if (quiz.randomize && isDbConnected) {
        qQuery += " ORDER BY RANDOM() LIMIT $2";
        qParams.push(quiz.question_count);
      }
      
      const questionsResult = await query(qQuery, qParams);
      const questions = questionsResult.rows;

      const questionsWithOptions = await Promise.all(questions.map(async (q: any) => {
        const optionsResult = await query("SELECT id, text FROM question_options WHERE question_id = $1", [q.id]);
        return { ...q, options: optionsResult.rows };
      }));

      res.json({ ...quiz, questions: questionsWithOptions });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/quizzes/:id/submit", async (req, res) => {
    try {
      const { userId, answers } = req.body;
      const quizResult = await query("SELECT * FROM quizzes WHERE id = $1", [req.params.id]);
      if (quizResult.rows.length === 0) return res.status(404).json({ error: "Quiz not found" });
      const quiz = quizResult.rows[0];

      const questionsResult = await query("SELECT * FROM questions WHERE quiz_id = $1", [req.params.id]);
      const questions = questionsResult.rows;
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const q of questions) {
        totalPoints += q.points;
        const correctOptionResult = await query("SELECT id FROM question_options WHERE question_id = $1 AND is_correct = TRUE", [q.id]);
        if (correctOptionResult.rows.length > 0 && answers[q.id] === correctOptionResult.rows[0].id) {
          earnedPoints += q.points;
        }
      }

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= quiz.passing_score;

      await query(`
        INSERT INTO quiz_submissions (id, user_id, quiz_id, score, passed)
        VALUES ($1, $2, $3, $4, $5)
      `, [randomUUID(), userId, quiz.id, score, passed]);

      res.json({ score, passed, passingScore: quiz.passing_score });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
