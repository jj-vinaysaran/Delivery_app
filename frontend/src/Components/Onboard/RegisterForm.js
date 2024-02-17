import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 6) {
      setError('Username must be at least 6 characters long');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register', {
        username,
        password,
        roles,
      });
      console.log('Registration successful');
      alert("User Registered successfully");
      // Clear form fields after successful registration
      setUsername('');
      setPassword('');
      setRoles('');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('Username already exists. Please choose a different username.');
        alert("User already exists");
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Role:</label>
          <div>
            <input
              type="radio"
              id="inventory"
              value="Inventory"
              checked={roles === 'Inventory'}
              onChange={() => setRoles('Inventory')}
            />
            <label htmlFor="inventory">Inventory</label>
          </div>
          <div>
            <input
              type="radio"
              id="delivery"
              value="Delivery"
              checked={roles === 'Delivery'}
              onChange={() => setRoles('Delivery')}
            />
            <label htmlFor="delivery">Delivery</label>
          </div>
        </div>
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login here</Link>.</p>
    </div>
  );
};

export default RegisterForm;
