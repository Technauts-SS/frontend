import React, { useState, useEffect } from "react";
import api from '../../api';
import "./UserProfile.css";
import Avatar from '../../assets/icons/avatar.png';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import FundraisingCard from '../fundraising/FundraisingCard';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

const UserProfile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
    social_links: "",
    bio: "",
    image: null,
    role: "user"
  });
  
  const [userFundraisers, setUserFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundraisersLoading, setFundraisersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone_number: "",
    social_links: "",
    bio: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const navigate = useNavigate();

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_BASE_URL}${imagePath}`;
  };

  const loadFundraisers = async () => {
    try {
      setFundraisersLoading(true);
      const response = await api.get('/fundraisers/my/');
      console.log('Fundraisers data:', response.data);
      
      // Виправлення для обробки пагінованої відповіді
      const fundraisersData = response.data.results || response.data;
      
      if (Array.isArray(fundraisersData)) {
        setUserFundraisers(fundraisersData);
      } else {
        console.error('Invalid data format:', response.data);
        setUserFundraisers([]);
      }
    } catch (error) {
      console.error('Error loading fundraisers:', error);
      setError('Не вдалося завантажити збори');
      setUserFundraisers([]);
    } finally {
      setFundraisersLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userResponse = await api.get('/users/me/');
        const userData = userResponse.data;
        
        setUser({
          username: userData.username || userData.email?.split('@')[0],
          email: userData.email,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          social_links: userData.social_links,
          bio: userData.bio,
          image: userData.image ? getFullImageUrl(userData.image) : null,
          role: userData.role || 'user'
        });

        setEditForm({
          full_name: userData.full_name || "",
          phone_number: userData.phone_number || "",
          social_links: userData.social_links || "",
          bio: userData.bio || ""
        });

        await loadFundraisers();

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
      setError('Помилка при виході з системи');
    }
  };

  const handleDeleteFundraiser = async (fundraiserId) => {
    try {
      await api.delete(`/fundraisers/${fundraiserId}/delete/`);
      // Оновлюємо список після видалення
      await loadFundraisers();
    } catch (error) {
      console.error('Failed to delete fundraiser:', error);
      setError('Не вдалося видалити збір');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Розмір файлу не повинен перевищувати 2MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Підтримуються тільки формати JPG, JPEG, PNG, GIF');
        return;
      }
      
      setNewImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      const formData = new FormData();
      
      Object.entries(editForm).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      
      if (newImage) {
        formData.append('image', newImage);
      }

      const response = await api.patch('/users/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(prev => ({
        ...prev,
        full_name: response.data.full_name,
        phone_number: response.data.phone_number,
        social_links: response.data.social_links,
        bio: response.data.bio,
        image: response.data.image 
          ? getFullImageUrl(response.data.image)
          : prev.image
      }));

      setIsEditing(false);
      setImagePreview(null);
      setNewImage(null);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.response?.data?.error || 'Не вдалося оновити профіль');
    }
  };

  const refreshFundraisers = async () => {
    await loadFundraisers();
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
        <button 
          onClick={() => {
            setError(null);
            window.location.reload();
          }} 
          className="retry-button"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {isEditing ? (
        <div className="edit-profile-section">
          <h2>Редагування профілю</h2>
          
          <div className="edit-avatar">
            <img 
              src={imagePreview || user.image || Avatar} 
              alt="Фото профілю" 
              className="profile-avatar"
              onError={(e) => { e.target.src = Avatar; }}
            />
            <label className="change-avatar-button">
              Змінити фото
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/gif" 
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>Повне ім'я</label>
            <input
              type="text"
              name="full_name"
              value={editForm.full_name}
              onChange={handleEditChange}
            />
          </div>
          
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="text"
              name="phone_number"
              value={editForm.phone_number}
              onChange={handleEditChange}
              placeholder="+380XXXXXXXXX"
            />
          </div>
          
          <div className="form-group">
            <label>Соціальні мережі</label>
            <input
              type="text"
              name="social_links"
              value={editForm.social_links}
              onChange={handleEditChange}
              placeholder="https://..."
            />
          </div>
          
          <div className="form-group">
            <label>Про себе</label>
            <textarea
              name="bio"
              value={editForm.bio}
              onChange={handleEditChange}
              rows="4"
            />
          </div>
          
          <div className="edit-actions">
            <button onClick={handleSaveProfile} className="save-button">
              Зберегти зміни
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setImagePreview(null);
                setNewImage(null);
                setError(null);
              }} 
              className="cancel-button"
            >
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <>
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
            {user.username && (
              <div className="detail-item">
                <span className="detail-label">Ім'я користувача:</span>
                <span className="detail-value">{user.username}</span>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Роль:</span>
              <span className="detail-value">
                {user.role === 'admin' ? 'Адміністратор' : 
                 user.role === 'moderator' ? 'Модератор' : 'Користувач'}
              </span>
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
                <a 
                  href={user.social_links} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="detail-value link"
                >
                  {user.social_links}
                </a>
              </div>
            )}

            {user.bio && (
              <div className="detail-item bio-item">
                <span className="detail-label">Про себе:</span>
                <p className="detail-value bio-text">{user.bio}</p>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button 
              onClick={() => setIsEditing(true)} 
              className="action-button edit-button"
            >
              Редагувати профіль
            </button>
            <Link 
              to="/create-fundraiser" 
              className="action-button create-fundraiser-button"
            >
              Створити збір
            </Link>
            
            {(user.role === 'admin' || user.role === 'moderator') && (
              <div className="moderator-actions">
                {user.role === 'admin' && (
                  <Link to="/admin" className="action-button admin-button">
                    Адмін панель
                  </Link>
                )}
                <Link to="/moderation" className="action-button moderation-button">
                  Панель модератора
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      <div className="user-fundraisers-section">
        <div className="fundraisers-header">
          <h3>Мої збори</h3>
        </div>
        
        {fundraisersLoading ? (
          <div className="loading-container">
            <div className="small-spinner"></div>
            <p>Завантаження зборів...</p>
          </div>
        ) : userFundraisers.length > 0 ? (
          <div className="fundraisers-grid">
            {userFundraisers.map(fundraiser => (
              <FundraisingCard
                key={fundraiser.id}
                id={fundraiser.id}
                title={fundraiser.title}
                category={fundraiser.category}
                description={fundraiser.description}
                image={fundraiser.image ? getFullImageUrl(fundraiser.image) : null}
                donationLink={fundraiser.donation_link}
                currentAmount={fundraiser.current_amount}
                goalAmount={fundraiser.goal_amount}
                onDelete={handleDeleteFundraiser}
                isOwner={true}
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