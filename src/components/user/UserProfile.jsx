import React, { useState, useEffect } from "react";
import api from '../../api';
import "./UserProfile.css";
import Avatar from '../../assets/icons/avatar.png';
import { Link, useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
    social_links: "",
    image: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
        if (!token) {
          navigate('/login');
          return;
        }
  
        const response = await api.get('/users/me/');  // Прибрано параметр headers
  
        console.log('User data received:', response.data);
  
        setUser({
          username: response.data.username,
          email: response.data.email,
          full_name: response.data.full_name,
          phone_number: response.data.phone_number,
          social_links: response.data.social_links,
          image: response.data.image
        });
  
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          console.log('Unauthorized access. Removing token.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError('Не вдалося завантажити дані профілю');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [navigate]);


  const handleLogout = async () => {
    try {
      await api.post('/users/logout/');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
          alt="Фото профілю" 
          className="profile-avatar"
          onError={(e) => { e.target.src = Avatar; }}
        />
        <h2>{user.full_name || user.username}</h2>
        <p className="profile-email">{user.email}</p>
      </div>

      <div className="profile-details">
        <div className="detail-item">
          <span className="detail-label">Ім'я користувача:</span>
          <span className="detail-value">{user.username}</span>
        </div>

        {user.phone_number && (
          <div className="detail-item">
            <span className="detail-label">Телефон:</span>
            <span className="detail-value">{user.phone_number}</span>
          </div>
        )}

        {user.social_links && (
          <div className="detail-item">
            <span className="detail-label">Соціальні мережі:</span>
            <a href={user.social_links} target="_blank" rel="noopener noreferrer" className="detail-value link">
              {user.social_links}
            </a>
          </div>
        )}
      </div>

      <div className="profile-actions">
        <Link to="/edit-profile" className="action-button edit-button">
          Редагувати профіль
        </Link>
        <button onClick={handleLogout} className="action-button logout-button">
          Вийти з акаунту
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
