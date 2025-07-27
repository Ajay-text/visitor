require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// MySQL connection using environment variables (fallback to localhost for local dev)
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || '',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'visitor_log'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1); // exit if no DB connection
  }
  console.log('Connected to MySQL database');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API to check in a visitor
app.post('/checkin', (req, res) => {
  const { name, contact, company, reason } = req.body;
  if (!name || !contact || !reason) {
    return res.status(400).send('Missing required fields');
  }

  const sql = 'INSERT INTO visitors (name, contact, company, reason) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, contact, company || '', reason], (err) => {
    if (err) {
      console.error('DB Insert Error:', err);
      return res.status(500).send('Database insert error');
    }
    res.sendStatus(200);
  });
});

// API to mark checkout time
app.post('/checkout', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).send('Missing visitor ID');
  }

  const sql = 'UPDATE visitors SET check_out = NOW() WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) {
      console.error('DB Update Error:', err);
      return res.status(500).send('Database update error');
    }
    res.sendStatus(200);
  });
});

// API to get all visitors
app.get('/visitors', (req, res) => {
  const sql = 'SELECT * FROM visitors ORDER BY check_in DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).send('Database fetch error');
    }
    res.json(results);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
