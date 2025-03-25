import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './VolunteerAuth.css';

const VolunteerAuth = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    interests: []
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email обов'язковий";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Невірний формат email";

    if (!formData.password) newErrors.password = "Пароль обов'язковий";
    else if (formData.password.length < 6) newErrors.password = "Пароль має бути не менше 6 символів";

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Паролі не співпадають";
      }

      if (!formData.fullName) newErrors.fullName = "Ім'я обов'язкове";

      if (!formData.phone) {
        newErrors.phone = "Телефон обов'язковий";
      } else if (!/^\+380\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = "Телефон має відповідати формату +380 XX XXX XX XX";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Form submitted", formData);
        alert(isLogin ? "Вхід успішний!" : "Реєстрація успішна!");
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Сталася помилка при обробці запиту");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">
          {isLogin ? 'Увійти на платформу' : 'Зареєструватися як волонтер'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="your@email.com"
              disabled={isSubmitting}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="password">Пароль</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          {!isLogin && (
            <>
              <div className="mb-4">
                <label htmlFor="confirmPassword">Підтвердіть пароль</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="fullName">Повне ім'я</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.fullName && <p className="error-message">{errors.fullName}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                  placeholder="+380 XX XXX XX XX"
                  disabled={isSubmitting}
                />
                {errors.phone && <p className="error-message">{errors.phone}</p>}
              </div>
            </>
          )}

          <button type="submit" className={isSubmitting ? 'loading' : ''} disabled={isSubmitting}>
            {isSubmitting ? 'Завантаження...' : isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>

          <div className="auth-link">
            <p>
              {isLogin ? 'Ще не маєте акаунта? ' : 'Вже маєте акаунт? '}
              <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Зареєструватися' : 'Увійти'}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerAuth;
