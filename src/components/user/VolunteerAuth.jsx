import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './VolunteerAuth.css';

const VolunteerAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isLogin = location.pathname === '/login';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (backendError) setBackendError('');
    
    console.log('Form data after change:', formData);
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

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError('');
    
    console.log('Form submit initiated', formData);
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        console.log('Attempting login with email:', formData.email);
        await login(formData.email, formData.password);
        console.log('Login successful');
        navigate('/profile');
      } else {
        const username = formData.email.split('@')[0];
        const cleanPhone = formData.phone.replace(/\D/g, '');
        
        const payload = {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone_number: cleanPhone.length > 0 ? `+${cleanPhone}` : null
        };

        console.log('Attempting registration with payload:', payload);
        const response = await api.post('/users/', payload);
        console.log('Registration successful:', response.data);
        alert('Реєстрація успішна! Тепер увійдіть у систему.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Request failed:', error);
      
      if (error.response) {
        console.log('Response error:', error.response);
        
        if (error.response.status === 400) {
          const errors = error.response.data;
          let errorMsg = '';
          
          if (errors.username) errorMsg += `Логін: ${errors.username.join(' ')}\n`;
          if (errors.email) errorMsg += `Email: ${errors.email.join(' ')}\n`;
          if (errors.password) errorMsg += `Пароль: ${errors.password.join(' ')}\n`;
          if (errors.phone_number) errorMsg += `Телефон: ${errors.phone_number.join(' ')}\n`;
          
          setBackendError(errorMsg || 'Невірні дані реєстрації');
        } else {
          setBackendError(`Помилка сервера: ${error.response.status}`);
        }
      } else {
        setBackendError('Помилка з\'єднання з сервером');
      }
    } finally {
      setIsSubmitting(false);
      console.log('Submit process ended');
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
            {backendError}
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
            </>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting}
          >
            {isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VolunteerAuth;
