import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom'; // Додано Navigate
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './VolunteerAuth.css';

const VolunteerAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth(); // Додано login
  const isLogin = location.pathname === '/login';

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" />;
    } else if (user?.role === 'moderator') {
      return <Navigate to="/moderation" />;
    }
    return <Navigate to="/profile" />;
  }
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    profileImage: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (backendError) setBackendError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      
      // Створення попереднього перегляду зображення
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "Email обов'язковий";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Невірний формат email";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обов'язковий";
    } else if (formData.password.length < 6) {
      newErrors.password = "Мінімум 6 символів";
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Паролі не співпадають";
      }
      if (!formData.fullName) {
        newErrors.fullName = "Повне ім'я обов'язкове";
      }
      if (!formData.phone) {
        newErrors.phone = "Телефон обов'язковий";
      } else if (!/^\+380\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = "Формат: +380XXXXXXXXX";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError('');
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/profile');
      } else {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        
        const formDataToSend = new FormData();
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('full_name', formData.fullName);
        formDataToSend.append('phone_number', cleanPhone.length > 0 ? `+${cleanPhone}` : '');
        
        if (formData.profileImage) {
          formDataToSend.append('profile_image', formData.profileImage);
        }

        const response = await api.post('/users/', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        alert('Реєстрація успішна! Тепер увійдіть у систему.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Request failed:', error);
      
      if (error.response) {
        if (error.response.status === 400) {
          const errors = error.response.data;
          let errorMsg = '';
          
          if (errors.email) errorMsg += `Email: ${errors.email.join(' ')}\n`;
          if (errors.password) errorMsg += `Пароль: ${errors.password.join(' ')}\n`;
          if (errors.phone_number) errorMsg += `Телефон: ${errors.phone_number.join(' ')}\n`;
          if (errors.profile_image) errorMsg += `Фото: ${errors.profile_image.join(' ')}\n`;
          
          setBackendError(errorMsg || 'Невірні дані реєстрації');
        } else {
          setBackendError(`Помилка сервера: ${error.response.status}`);
        }
      } else {
        setBackendError('Помилка з\'єднання з сервером');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? 'Увійти в систему' : 'Реєстрація волонтера'}
        </h2>
        
        {backendError && (
          <div className="backend-error">
            {backendError.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="your@example.com"
              disabled={isSubmitting}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              placeholder="************"
              disabled={isSubmitting}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Підтвердіть пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  placeholder="************"
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Повне ім'я</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? 'input-error' : ''}
                  placeholder="Введіть ваше повне ім'я"
                  disabled={isSubmitting}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'input-error' : ''}
                  placeholder="+380XXXXXXXXX"
                  disabled={isSubmitting}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="profileImage">Фото профілю</label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  disabled={isSubmitting}
                />
                {imagePreview && (
                  <div className="image-preview-container">
                    <img 
                      src={imagePreview} 
                      alt="Попередній перегляд" 
                      className="image-preview"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting}
          >
            {isLogin ? (
              isSubmitting ? 'Вхід...' : 'Увійти'
            ) : (
              isSubmitting ? 'Реєстрація...' : 'Зареєструватися'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VolunteerAuth;