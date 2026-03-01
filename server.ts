import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import multer from "multer";

const db = new Database("finance.db");

// Ensure public directory exists
const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Multer setup for profile picture
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    cb(null, "profile.jpg"); // Always overwrite with profile.jpg
  },
});
const upload = multer({ storage });

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'income' or 'expense'
    icon TEXT,
    color TEXT,
    is_default INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category_id INTEGER,
    date TEXT NOT NULL,
    notes TEXT,
    is_recurring INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT
  );

  CREATE TABLE IF NOT EXISTS recurring_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category_id INTEGER,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    last_executed TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT,
    balance REAL DEFAULT 0,
    type TEXT DEFAULT 'savings',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default categories if empty or missing
const seedCategories = () => {
  const defaultCategories = [
    { name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444' },
    { name: 'Transport', type: 'expense', icon: 'Car', color: '#f59e0b' },
    { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#3b82f6' },
    { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6' },
    { name: 'Entertainment', type: 'expense', icon: 'Gamepad2', color: '#ec4899' },
    { name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#10b981' },
    { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#6366f1' },
    { name: 'Housing', type: 'expense', icon: 'Home', color: '#6366f1' },
    { name: 'Utilities', type: 'expense', icon: 'Zap', color: '#f59e0b' },
    { name: 'Insurance', type: 'expense', icon: 'ShieldCheck', color: '#3b82f6' },
    { name: 'Personal Care', type: 'expense', icon: 'User', color: '#ec4899' },
    { name: 'Travel', type: 'expense', icon: 'Plane', color: '#06b6d4' },
    { name: 'Groceries', type: 'expense', icon: 'ShoppingBasket', color: '#10b981' },
    { name: 'Fitness', type: 'expense', icon: 'Dumbbell', color: '#f43f5e' },
    { name: 'Subscriptions', type: 'expense', icon: 'Tv', color: '#8b5cf6' },
    { name: 'Donations', type: 'expense', icon: 'Heart', color: '#f43f5e' },
    { name: 'Others', type: 'expense', icon: 'MoreHorizontal', color: '#6b7280' },
    { name: 'Salary', type: 'income', icon: 'Wallet', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#3b82f6' },
    { name: 'Business', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
    { name: 'Investment', type: 'income', icon: 'LineChart', color: '#06b6d4' },
    { name: 'Rental', type: 'income', icon: 'Home', color: '#f59e0b' },
    { name: 'Bonus', type: 'income', icon: 'Sparkles', color: '#fbbf24' },
    { name: 'Interest', type: 'income', icon: 'Percent', color: '#10b981' },
    { name: 'Gifts', type: 'income', icon: 'Gift', color: '#f59e0b' },
    { name: 'Other income', type: 'income', icon: 'PlusCircle', color: '#6b7280' },
  ];

  const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, 1)");
  const checkCategory = db.prepare("SELECT id FROM categories WHERE name = ? AND type = ?");
  
  defaultCategories.forEach(cat => {
    const exists = checkCategory.get(cat.name, cat.type);
    if (!exists) {
      insertCategory.run(cat.name, cat.type, cat.icon, cat.color);
    }
  });
};

seedCategories();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/public", express.static("public"));

  // API Routes
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name, type, icon, color } = req.body;
    const result = db.prepare("INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)").run(name, type, icon, color);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
      FROM transactions t 
      LEFT JOIN categories c ON t.category_id = c.id 
      ORDER BY date DESC
    `).all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { amount, type, category_id, date, notes } = req.body;
    const result = db.prepare("INSERT INTO transactions (amount, type, category_id, date, notes) VALUES (?, ?, ?, ?, ?)").run(amount, type, category_id, date, notes);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/budgets", (req, res) => {
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name 
      FROM budgets b 
      JOIN categories c ON b.category_id = c.id
    `).all();
    res.json(budgets);
  });

  app.post("/api/budgets", (req, res) => {
    const { category_id, amount, month, year } = req.body;
    const result = db.prepare("INSERT OR REPLACE INTO budgets (category_id, amount, month, year) VALUES (?, ?, ?, ?)").run(category_id, amount, month, year);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/savings", (req, res) => {
    const goals = db.prepare("SELECT * FROM savings_goals").all();
    res.json(goals);
  });

  app.post("/api/savings", (req, res) => {
    const { name, target_amount, current_amount, deadline } = req.body;
    const result = db.prepare("INSERT INTO savings_goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)").run(name, target_amount, current_amount, deadline);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/bank-accounts", (req, res) => {
    const accounts = db.prepare("SELECT * FROM bank_accounts").all();
    res.json(accounts);
  });

  app.post("/api/bank-accounts", (req, res) => {
    const { name, bank_name, account_number, balance, type } = req.body;
    const result = db.prepare("INSERT INTO bank_accounts (name, bank_name, account_number, balance, type) VALUES (?, ?, ?, ?, ?)").run(name, bank_name, account_number, balance, type);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/bank-accounts/:id", (req, res) => {
    db.prepare("DELETE FROM bank_accounts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/savings/:id", (req, res) => {
    const { current_amount } = req.body;
    db.prepare("UPDATE savings_goals SET current_amount = ? WHERE id = ?").run(current_amount, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/recurring", (req, res) => {
    const recurring = db.prepare(`
      SELECT r.*, c.name as category_name 
      FROM recurring_templates r 
      JOIN categories c ON r.category_id = c.id
    `).all();
    res.json(recurring);
  });

  app.post("/api/recurring", (req, res) => {
    const { amount, type, category_id, frequency } = req.body;
    const result = db.prepare("INSERT INTO recurring_templates (amount, type, category_id, frequency) VALUES (?, ?, ?, ?)").run(amount, type, category_id, frequency);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/upload-profile", upload.single("profile"), (req, res) => {
    res.json({ success: true, url: "/public/profile.jpg?t=" + Date.now() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
