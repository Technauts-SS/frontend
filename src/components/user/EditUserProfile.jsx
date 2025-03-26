import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EditUserProfile.css';

const EditUserProfile = () => {
  const navigate = useNavigate();
  
  // Початковий стан даних користувача
  const [userData, setUserData] = useState({
    full_name: '',  // Змінено з name на full_name для відповідності бекенду
    email: '',
    phone_number: '',  // Змінено з phone на phone_number
    bio: '',
    social_links: ''  // Додано нове поле
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`  // Змінено з Bearer на Token
          }
        });
        
        // Оновлюємо стан з даними від бекенду
        setUserData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          bio: response.data.bio || '',
          social_links: response.data.social_links || ''
        });
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          // Якщо токен недійсний - перенаправляємо на логін
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищення помилок при зміні поля
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!userData.full_name?.trim()) {
      errors.full_name = "Ім'я не може бути порожнім";
    }
    
    if (!userData.email?.trim()) {
      errors.email = "Email не може бути порожнім";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = "Введіть коректну email адресу";
    }
    
    if (userData.phone_number && !/^\+?\d{10,15}$/.test(userData.phone_number)) {
      errors.phone_number = "Введіть коректний номер телефону";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await axios.put(
        'http://127.0.0.1:8000/api/users/me/', 
        userData,
        {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Профіль успішно оновлено!');
      
      // Оновлюємо локальні дані
      const updatedUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        ...response.data
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Перенаправлення через 2 секунди
      setTimeout(() => navigate('/profile'), 2000);
      
    } catch (error) {
      console.error('Update error:', error);
      
      let errorMessage = 'Помилка при оновленні профілю';
      if (error.response) {
        // Обробка помилок валідації від бекенду
        if (error.response.status === 400) {
          errorMessage = Object.values(error.response.data).join('\n');
        } else if (error.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="edit-profile-loading">
        <div className="spinner"></div>
        <p>Завантаження даних профілю...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <h1 className="edit-profile-title">Редагування профілю</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className={`form-group ${formErrors.full_name ? 'has-error' : ''}`}>
          <label htmlFor="full_name">Повне ім'я</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={userData.full_name}
            onChange={handleChange}
            required
          />
          {formErrors.full_name && (
            <span className="error-text">{formErrors.full_name}</span>
          )}
        </div>
        
        <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            required
          />
          {formErrors.email && (
            <span className="error-text">{formErrors.email}</span>
          )}
        </div>
        
        <div className={`form-group ${formErrors.phone_number ? 'has-error' : ''}`}>
          <label htmlFor="phone_number">Телефон</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={userData.phone_number}
            onChange={handleChange}
            placeholder="+380XXXXXXXXX"
          />
          {formErrors.phone_number && (
            <span className="error-text">{formErrors.phone_number}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">Біографія</label>
          <textarea
            id="bio"
            name="bio"
            value={userData.bio}
            onChange={handleChange}
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="social_links">Соціальні мережі</label>
          <input
            type="url"
            id="social_links"
            name="social_links"
            value={userData.social_links}
            onChange={handleChange}
            placeholder="https://example.com/profile"
          />
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="btn btn-save"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner"></span>
                Збереження...
              </>
            ) : (
              'Зберегти зміни'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserProfile;