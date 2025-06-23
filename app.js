const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
}));

// Dummy user data (replace this with your actual database logic)
const users = [
  { email: 'adeel@gmail.com', password: '123' }, // Password: "password123"
];

// Login Route (POST)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user from the database (replace with real logic)
  const user = users.find(u => u.email === email);

  if (user) {
    // Check if the password matches
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        // Create a session and redirect to the main page
        req.session.user = user;  // Store user info in session
        res.redirect('/main');
      } else {
        // Incorrect password
        res.send('Incorrect password.');
      }
    });
  } else {
    // User not found
    res.send('User not found.');
  }
});

// Main Page Route (GET)
app.get('/main', (req, res) => {
  if (req.session.user) {
    // Render the main page if the user is logged in
    res.render('main');  
  } else {
    // Redirect to login if the user is not logged in
    res.redirect('/login');
  }
});

// Logout Route (GET)
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error during logout.');
    }
    res.redirect('/login');
  });
});

// Render Login Page (GET)
app.get('/login', (req, res) => {
  res.render('login');  // Render login page
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
