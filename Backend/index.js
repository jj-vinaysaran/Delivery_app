const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

    const user = results[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
      
      // If authentication is successful, send back user's role
      res.status(200).json({ role: user.roles });
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

// Inventory Management Controllers

// Controller to add a new inventory item
app.post('/inventory/add', (req, res) => {
  const { name, category, quantity, description } = req.body;

  connection.query('INSERT INTO inventory_items (name, category, quantity, description) VALUES (?, ?, ?, ?)',
    [name, category, quantity, description],
    (error, results) => {
      if (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      console.log('Inventory item added successfully');
      res.status(201).json({ message: 'Inventory item added successfully' });
    });
});

// Controller to remove an inventory item
app.delete('/inventory/remove/:id', (req, res) => {
  const itemId = req.params.id;

  connection.query('DELETE FROM inventory_items WHERE id = ?', [itemId], (error, results) => {
    if (error) {
      console.error('Error removing inventory item:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    console.log('Inventory item removed successfully');
    res.json({ message: 'Inventory item removed successfully' });
  });
});

// Controller to update an inventory item
app.put('/inventory/update/:id', (req, res) => {
  const itemId = req.params.id;
  const { name, category, quantity, description } = req.body;

  connection.query('UPDATE inventory_items SET name = ?, category = ?, quantity = ?, description = ? WHERE id = ?',
    [name, category, quantity, description, itemId],
    (error, results) => {
      if (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      console.log('Inventory item updated successfully');
      res.json({ message: 'Inventory item updated successfully' });
    });
});

// Controller to get all inventory items
app.get('/inventory/all', (req, res) => {
  connection.query('SELECT * FROM inventory_items', (error, results) => {
    if (error) {
      console.error('Error fetching inventory items:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log(results);

    res.json(results);
  });
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)) // Unique filename
  }
});

const upload = multer({ storage: storage });

// Controller for uploading inventory files
app.post('/inventory/upload', upload.single('file'), (req, res) => {
  // Extract file details from req.file
  const { filename, mimetype } = req.file;

  // Extract user details from request body or headers, if needed
  const { uploaded_by } = req.body;

  // Read the uploaded file data
  const fileData = fs.readFileSync(req.file.path);

  // Prepare SQL query to insert file details into the database
  const sql = 'INSERT INTO inventory_files (file_name, file_type, file_data, uploaded_by) VALUES (?, ?, ?, ?)';

  // Execute SQL query with file details
  connection.query(sql, [filename, mimetype, fileData, uploaded_by], (error, results) => {
    if (error) {
      console.error('Error uploading inventory file:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    console.log('Inventory file uploaded successfully');
    
    // Remove the temporary file after successful upload
    fs.unlinkSync(req.file.path);

    res.status(200).json({ message: 'Inventory file uploaded successfully' });
  });
});

// Controller to retrieve uploaded inventory files
app.get('/inventory/files', (req, res) => {
  connection.query('SELECT id, file_name, file_type, uploaded_by, uploaded_at FROM inventory_files', (error, results) => {
    if (error) {
      console.error('Error fetching inventory files:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
