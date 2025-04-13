import React, { useState } from 'react';
import './DonationForm.css';

const DonationForm = ({ onSubmit, onCancel, isAuthenticated }) => {
    const [formData, setFormData] = useState({
        amount: '',
        mock_card_number: '4242424242424242',
        name: '',
        email: '',
        message: '',
        // Додаткові поля для неавторизованих користувачів
        phone: '',
        anonymous: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === "anonymous") {
            setFormData(prev => ({
                ...prev,
                [name]: e.target.checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Будь ласка, введіть коректну суму';
        }
        
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Будь ласка, введіть коректний email';
        }
        
        // Якщо користувач не авторизований і не анонімний, перевіряємо обов'язкові поля
        if (!isAuthenticated && !formData.anonymous) {
            if (!formData.name || formData.name.trim() === '') {
                newErrors.name = 'Будь ласка, введіть ваше ім\'я';
            }
            
            if (!formData.email || formData.email.trim() === '') {
                newErrors.email = 'Будь ласка, введіть email';
            }
            
            if (!formData.phone || formData.phone.trim() === '') {
                newErrors.phone = 'Будь ласка, введіть номер телефону';
            } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
                newErrors.phone = 'Введіть коректний номер телефону';
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
                await onSubmit({
                    ...formData,
                    amount: parseFloat(formData.amount)
                });
                // Якщо потрібно очистити форму після успішного надсилання
                // setFormData({
                //    amount: '',
                //    mock_card_number: '4242424242424242',
                //    name: '',
                //    email: '',
                //    message: '',
                //    phone: '',
                //    anonymous: true
                // });
            } catch (error) {
                console.error("Помилка при надсиланні донату:", error);
                setErrors(prev => ({
                    ...prev, 
                    form: 'Виникла помилка при оформленні донату. Спробуйте ще раз.'
                }));
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form className="donation-form" onSubmit={handleSubmit}>
            {errors.form && (
                <div className="error-banner">
                    <span className="error-message">{errors.form}</span>
                </div>
            )}
            
            <div className="form-group">
                <label>Сума донату (грн) *</label>
                <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    className={errors.amount ? 'error' : ''}
                    disabled={isSubmitting}
                />
                {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            {/* Показуємо чекбокс анонімності лише для неавторизованих користувачів */}
            {!isAuthenticated && (
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="anonymous"
                        name="anonymous"
                        checked={formData.anonymous}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                    <label htmlFor="anonymous">Анонімний донат</label>
                    <p className="hint">
                        Якщо цей параметр вимкнено, потрібно буде заповнити додаткові дані
                    </p>
                </div>
            )}

            {/* Поле імені - різні вимоги для різних категорій користувачів */}
            <div className="form-group">
                <label>
                    {isAuthenticated ? 'Ваше ім\'я (необов\'язково)' : 
                     !formData.anonymous ? 'Ваше ім\'я *' : 'Ваше ім\'я (необов\'язково)'}
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Як до вас звертатися?"
                    className={errors.name ? 'error' : ''}
                    required={!isAuthenticated && !formData.anonymous}
                    disabled={isSubmitting}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Поле email - різні вимоги для різних категорій користувачів */}
            <div className="form-group">
                <label>
                    {!isAuthenticated && !formData.anonymous ? 'Email *' : 'Email (необов\'язково)'}
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Для відправки квитанції"
                    className={errors.email ? 'error' : ''}
                    required={!isAuthenticated && !formData.anonymous}
                    disabled={isSubmitting}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Поле телефону - тільки для неавторизованих неанонімних користувачів */}
            {!isAuthenticated && !formData.anonymous && (
                <div className="form-group">
                    <label>Телефон *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+380XXXXXXXXX"
                        className={errors.phone ? 'error' : ''}
                        required
                        disabled={isSubmitting}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
            )}

            <div className="form-group">
                <label>Повідомлення (необов'язково)</label>
                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Ваш коментар або побажання"
                    rows="3"
                    disabled={isSubmitting}
                />
            </div>

            <div className="form-group">
                <label>Тестовий спосіб оплати *</label>
                <select
                    name="mock_card_number"
                    value={formData.mock_card_number}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                >
                    <option value="4242424242424242">Успішна оплата (4242...)</option>
                    <option value="4000000000000002">Відмова в оплаті (4000...)</option>
                    <option value="5555555555554444">Тестова Mastercard (5555...)</option>
                </select>
                <p className="hint">Це тестова система, реальні гроші не списуються</p>
            </div>

            <div className="form-actions">
                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Обробка...' : 'Підтвердити донат'}
                </button>
                <button 
                    type="button" 
                    className="cancel-button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Скасувати
                </button>
            </div>
        </form>
    );
};

export default DonationForm;