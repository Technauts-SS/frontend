import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./UserProfile.css";
import Avatar from '../../assets/icons/avatar.png';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    bio: "",
    image: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Отримання даних користувача з API
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/user/profile/')
      .then(response => {
        setUser(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setError('Не вдалося завантажити дані профілю. Спробуйте пізніше.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="profile-container loading">
        <div className="loading-spinner"></div>
        <p>Завантаження профілю...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container error">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img 
          src={user.image || Avatar} 
          alt="Фото користувача" 
          className="profile-avatar" 
          onError={(e) => { e.target.src = Avatar; }}
        />
        <h2>{user.username || "Користувач"}</h2>
        <p>{user.email}</p>
      </div>

      <div className="profile-body">
        {user.phone && (
          <>
            <h3>Телефон:</h3>
            <p>{user.phone}</p>
          </>
        )}
        
        {user.bio && (
          <>
            <h3>Біографія:</h3>
            <p>{user.bio}</p>
          </>
        )}
        
        <div className="profile-actions">
          <Link to="/edit-profile" className="edit-profile-button">
            Редагувати профіль
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;