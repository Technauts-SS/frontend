import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import './EditUserProfile.css';
import Avatar from '../../assets/icons/avatar.png';

const EditUserProfile = () => {
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    bio: '',
    social_links: '',
    image: null
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/me/');
        
        setUserData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          bio: response.data.bio || '',
          social_links: response.data.social_links || '',
          image: response.data.image || null
        });
        
        setPreviewImage(response.data.image ? `${response.data.image}` : '');
        
      } catch (error) {
        console.error('Error fetching user data:', error);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Розмір файлу не повинен перевищувати 2MB');
        return;
      }
      
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setRemoveImage(false);
      setError(null);
    }
  };

  const handleRemovePhoto = () => {
    setRemoveImage(true);
    setSelectedImage(null);
    setPreviewImage(Avatar);
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
    
    if (userData.social_links && !/^https?:\/\/.+\..+/.test(userData.social_links)) {
      errors.social_links = "Введіть коректне посилання (починається з http/https)";
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
      
      const formData = new FormData();
      
      formData.append('full_name', userData.full_name);
      formData.append('email', userData.email);
      formData.append('phone_number', userData.phone_number || '');
      formData.append('bio', userData.bio || '');
      formData.append('social_links', userData.social_links || '');
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      } else if (removeImage) {
        formData.append('remove_image', 'true');
      }
      
      const response = await api.patch('/users/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Профіль успішно оновлено!');
      
      const updatedUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        ...response.data
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => navigate('/profile'), 2000);
      
    } catch (error) {
      console.error('Update error:', error);
      
      let errorMessage = 'Помилка при оновленні профілю';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
        } else if (error.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        } else if (error.response.status === 413) {
          errorMessage = 'Файл занадто великий. Максимальний розмір: 2MB';
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
          {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-group">
          <label htmlFor="image">Фото профілю</label>
          <div className="image-preview-container">
            <img 
              src={removeImage ? Avatar : (previewImage || userData.image || Avatar)} 
              alt="Прев'ю" 
              className="image-preview"
            />
            <div className="image-controls">
              <label className="btn-upload">
                {userData.image || previewImage ? 'Змінити фото' : 'Додати фото'}
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={saving}
                  style={{ display: 'none' }}
                />
              </label>
              
              {!removeImage && (userData.image || previewImage) && (
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
          </div>
        </div>
        
        <div className={`form-group ${formErrors.full_name ? 'has-error' : ''}`}>
          <label htmlFor="full_name">Повне ім'я</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={userData.full_name}
            onChange={handleChange}
            required
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
          />
        </div>
        
        <div className={`form-group ${formErrors.social_links ? 'has-error' : ''}`}>
          <label htmlFor="social_links">Соціальні мережі</label>
          <input
            type="url"
            id="social_links"
            name="social_links"
            value={userData.social_links}
            onChange={handleChange}
            placeholder="https://example.com/profile"
            disabled={saving}
          />
          {formErrors.social_links && (
            <span className="error-text">{formErrors.social_links}</span>
          )}
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