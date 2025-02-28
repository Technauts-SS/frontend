import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditUserProfile = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    // Отримуємо дані профілю при завантаженні сторінки
    axios.get('http://127.0.0.1:8000/api/user/profile/')
      .then(response => setUserData(response.data))
      .catch(error => console.error('Error fetching user data:', error));
  }, []);

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put('http://127.0.0.1:8000/api/user/profile/', userData)
      .then(response => alert('Profile updated!'))
      .catch(error => console.error('Error updating profile:', error));
  };

  return (
    <div>
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={userData.name}
          onChange={handleChange}
          placeholder="Name"
        />
        <input
          type="email"
          name="email"
          value={userData.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <textarea
          name="bio"
          value={userData.bio}
          onChange={handleChange}
          placeholder="Bio"
        />
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default EditUserProfile;
