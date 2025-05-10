import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import './EditUserProfile.css';
import Avatar from '../../assets/icons/avatar.png';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditUserProfile = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    bio: '',
    social_links: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/me/');
        
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          bio: response.data.bio || '',
          social_links: response.data.social_links || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        
        if (response.data.profile_image) {
          setImagePreview(response.data.profile_image);
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setServerError('Не вдалося завантажити дані профілю');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаємо помилку при зміні поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Перевірка розміру файлу (2MB максимум)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_image: 'Розмір файлу не повинен перевищувати 2MB' }));
        return;
      }
      
      // Перевірка типу файлу
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, profile_image: 'Допустимі формати: JPG, PNG, GIF' }));
        return;
      }
      
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
      setErrors(prev => ({ ...prev, profile_image: '' }));
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    setImagePreview('');
    setRemoveImage(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Повне ім'я обов'язкове";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email обов'язковий";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Невірний формат email";
    }
    
    if (formData.phone_number && !/^\+?\d{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Невірний формат телефону";
    }
    
    if (formData.social_links && !/^https?:\/\/.+\..+/.test(formData.social_links)) {
      newErrors.social_links = "Невірний формат посилання";
    }
    
    // Валідація пароля, якщо введено новий
    if (formData.new_password || formData.confirm_password) {
      if (!formData.current_password) {
        newErrors.current_password = "Введіть поточний пароль";
      }
      
      if (formData.new_password.length < 8) {
        newErrors.new_password = "Мінімум 8 символів";
      }
      
      if (formData.new_password !== formData.confirm_password) {
        newErrors.confirm_password = "Паролі не співпадають";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setServerError('');
      
      const formDataToSend = new FormData();
      
      // Додаємо текстові поля
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'confirm_password') {
          formDataToSend.append(key, value);
        }
      });
      
      // Додаємо фото, якщо воно було вибране
      if (profileImage) {
        formDataToSend.append('profile_image', profileImage);
      } else if (removeImage) {
        formDataToSend.append('profile_image', '');
      }
      
      const response = await api.patch('/users/me/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Показуємо повідомлення про успіх
      toast.success('Профіль успішно оновлено!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Оновлюємо дані користувача в локальному сховищі
      const updatedUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        ...response.data
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Перенаправляємо на сторінку профілю через 1 секунду
      setTimeout(() => navigate('/profile'), 1000);
      
    } catch (error) {
      console.error('Update error:', error);
      
      let errorMessage = 'Помилка при оновленні профілю';
      if (error.response) {
        if (error.response.status === 400) {
          // Обробка помилок валідації з бекенду
          const backendErrors = error.response.data;
          errorMessage = Object.entries(backendErrors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          
          // Встановлюємо помилки для відображення в формі
          const formErrors = {};
          Object.keys(backendErrors).forEach(key => {
            formErrors[key] = Array.isArray(backendErrors[key]) ? backendErrors[key].join(' ') : backendErrors[key];
          });
          setErrors(formErrors);
        } else if (error.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        } else if (error.response.status === 413) {
          errorMessage = 'Файл занадто великий. Максимальний розмір: 2MB';
        }
      }
      
      setServerError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
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
      
      {serverError && (
        <div className="alert alert-error">
          {serverError.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-group">
          <label htmlFor="profile_image">Фото профілю</label>
          <div className="image-preview-container">
            <img 
              src={removeImage ? Avatar : (imagePreview || Avatar)} 
              alt="Фото профілю" 
              className="image-preview"
              onError={(e) => { e.target.src = Avatar; }}
            />
            <div className="image-controls">
              <label className="btn-upload">
                {imagePreview ? 'Змінити фото' : 'Додати фото'}
                <input
                  type="file"
                  id="profile_image"
                  name="profile_image"
                  accept="image/jpeg, image/png, image/gif"
                  onChange={handleImageChange}
                  disabled={saving}
                  style={{ display: 'none' }}
                />
              </label>
              
              {(imagePreview || formData.profile_image) && !removeImage && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={handleRemovePhoto}
                  disabled={saving}
                >
                  Видалити фото
                </button>
              )}
            </div>
            {errors.profile_image && (
              <span className="error-text">{errors.profile_image}</span>
            )}
          </div>
        </div>
        
        <div className={`form-group ${errors.full_name ? 'has-error' : ''}`}>
          <label htmlFor="full_name">Повне ім'я *</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            disabled={saving}
          />
          {errors.full_name && (
            <span className="error-text">{errors.full_name}</span>
          )}
        </div>
        
        <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={saving}
          />
          {errors.email && (
            <span className="error-text">{errors.email}</span>
          )}
        </div>
        
        <div className={`form-group ${errors.phone_number ? 'has-error' : ''}`}>
          <label htmlFor="phone_number">Телефон</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="+380XXXXXXXXX"
            disabled={saving}
          />
          {errors.phone_number && (
            <span className="error-text">{errors.phone_number}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">Про себе</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            disabled={saving}
          />
        </div>
        
        <div className={`form-group ${errors.social_links ? 'has-error' : ''}`}>
          <label htmlFor="social_links">Соціальні мережі</label>
          <input
            type="url"
            id="social_links"
            name="social_links"
            value={formData.social_links}
            onChange={handleChange}
            placeholder="https://example.com/profile"
            disabled={saving}
          />
          {errors.social_links && (
            <span className="error-text">{errors.social_links}</span>
          )}
        </div>
        
        <div className="password-section">
          <h3>Зміна пароля</h3>
          
          <div className={`form-group ${errors.current_password ? 'has-error' : ''}`}>
            <label htmlFor="current_password">Поточний пароль</label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              disabled={saving}
            />
            {errors.current_password && (
              <span className="error-text">{errors.current_password}</span>
            )}
          </div>
          
          <div className={`form-group ${errors.new_password ? 'has-error' : ''}`}>
            <label htmlFor="new_password">Новий пароль</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              disabled={saving}
            />
            {errors.new_password && (
              <span className="error-text">{errors.new_password}</span>
            )}
          </div>
          
          <div className={`form-group ${errors.confirm_password ? 'has-error' : ''}`}>
            <label htmlFor="confirm_password">Підтвердіть новий пароль</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              disabled={saving}
            />
            {errors.confirm_password && (
              <span className="error-text">{errors.confirm_password}</span>
            )}
          </div>
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