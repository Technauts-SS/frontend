import React, { useState, useEffect } from "react";
import api from '../../api';
import "./UserProfile.css";
import Avatar from '../../assets/icons/avatar.png';
import { Link, useNavigate } from 'react-router-dom';
import FundraisingCard from '../fundraising/FundraisingCard';

const UserProfile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
    social_links: "",
    image: null,
  });
  
  const [userFundraisers, setUserFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundraisersLoading, setFundraisersLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Отримання даних профілю
        const userResponse = await api.get('/users/me/');
        setUser({
          username: userResponse.data.username,
          email: userResponse.data.email,
          full_name: userResponse.data.full_name,
          phone_number: userResponse.data.phone_number,
          social_links: userResponse.data.social_links,
          image: userResponse.data.image
        });

        // Отримання зборів користувача
        setFundraisersLoading(true);
        const fundraisersResponse = await api.get('/fundraisers/my/');
        setUserFundraisers(fundraisersResponse.data);
        setFundraisersLoading(false);

      } catch (error) {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
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
        <Link to="/create-fundraiser" className="action-button create-fundraiser-button">
          Створити збір
        </Link>
        <button onClick={handleLogout} className="action-button logout-button">
          Вийти з акаунту
        </button>
      </div>

      {/* Секція зі створеними зборами */}
      <div className="user-fundraisers-section">
        <h3>Мої збори</h3>
        
        {fundraisersLoading ? (
          <p>Завантаження зборів...</p>
        ) : userFundraisers.length > 0 ? (
          <div className="fundraisers-grid">
            {userFundraisers.map(fundraiser => (
              <FundraisingCard
                key={fundraiser.id}
                id={fundraiser.id}
                title={fundraiser.title}
                category={fundraiser.category}
                description={fundraiser.description}
                image={fundraiser.image}
                donationLink={fundraiser.donation_link}
                currentAmount={fundraiser.current_amount}
                goalAmount={fundraiser.goal_amount}
              />
            ))}
          </div>
        ) : (
          <div className="no-fundraisers">
            <p>Ви ще не створили жодного збору</p>
            <Link to="/create-fundraiser" className="create-fundraiser-link">
              Створити перший збір
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;