const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Saran@533',
  database: 'Del_db'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Login endpoint:
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error('Error authenticating user:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    console.log(results);
    const user = results[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
      console.log("user validated", user.roles)
      // If authentication is successful, send back user's role
      res.status(200).json({ role: user.roles });
      
      // res.status(200).send(user.roles);
    });
  });
});


// Register endpoint
app.post('/register', (req, res) => {
  const { username, password, roles } = req.body;

  // Check if user with the same username already exists
  connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error('Error checking existing user:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length > 0) {
      res.status(409).json({ error: 'Username already exists. Please choose a different username.' });
      return;
    }

    // If user does not exist, proceed with registration
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      connection.query('INSERT INTO users (username, password, roles) VALUES (?, ?, ?)', [username, hash, roles], (error, results) => {
        if (error) {
          console.error('Error registering user:', error);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }

        console.log('User registered successfully');
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
});

// Endpoint to fetch user role
app.get('/user/role', (req, res) => {
  const { username } = req.query;

  // Query database to fetch user's role
  connection.query('SELECT roles FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error('Error fetching user role:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Extract user's role from query results
    const { roles } = results[0];
    res.json({ role: roles });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
