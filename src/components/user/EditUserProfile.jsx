import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EditUserProfile.css';

const EditUserProfile = () => {
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Отримання даних користувача при завантаженні компонента
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/user/profile/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        setUserData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setError('Не вдалося завантажити дані профілю. Перевірте підключення до мережі.');
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
    
    // Очищення помилок при зміні поля
    if (formErrors[name]) {
      const updatedErrors = {...formErrors};
      delete updatedErrors[name];
      setFormErrors(updatedErrors);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!userData.name || userData.name.trim() === '') {
      errors.name = "Ім'я не може бути порожнім";
    }
    
    if (!userData.email || userData.email.trim() === '') {
      errors.email = "Email не може бути порожнім";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = "Введіть коректну email адресу";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    axios.put('http://127.0.0.1:8000/api/user/profile/', userData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        setSuccess('Профіль успішно оновлено!');
        setSaving(false);
        // Перенаправлення на сторінку профілю через 2 секунди
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      })
      .catch(error => {
        console.error('Error updating profile:', error);
        setError(error.response?.data?.message || 'Помилка при оновленні профілю. Спробуйте пізніше.');
        setSaving(false);
      });
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="edit-profile-container loading">
        <div className="loading-spinner"></div>
        <p>Завантаження даних...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <h2>Редагування профілю</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Ім'я</label>
          <input
            type="text"
            id="name"
            name="name"
            value={userData.name || ''}
            onChange={handleChange}
            className={formErrors.name ? 'error' : ''}
          />
          {formErrors.name && <span className="field-error">{formErrors.name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email || ''}
            onChange={handleChange}
            className={formErrors.email ? 'error' : ''}
          />
          {formErrors.email && <span className="field-error">{formErrors.email}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Телефон</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={userData.phone || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">Біографія</label>
          <textarea
            id="bio"
            name="bio"
            value={userData.bio || ''}
            onChange={handleChange}
            rows={5}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={handleCancel}
            disabled={saving}
          >
            Скасувати
          </button>
          <button 
            type="submit" 
            className="save-button" 
            disabled={saving}
          >
            {saving ? "Збереження..." : "Зберегти зміни"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserProfile;