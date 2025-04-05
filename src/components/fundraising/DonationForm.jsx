import React, { useState } from 'react';
import './DonationForm.css';

const DonationForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        amount: '',
        mock_card_number: '4242424242424242',
        name: '',
        email: '',
        message: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
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
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            onSubmit({
                ...formData,
                amount: parseFloat(formData.amount)
            });
        }
    };

    return (
        <form className="donation-form" onSubmit={handleSubmit}>
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
                />
                {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            <div className="form-group">
                <label>Ваше ім'я (необов'язково)</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Як до вас звертатися?"
                />
            </div>

            <div className="form-group">
                <label>Email (необов'язково)</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Для відправки квитанції"
                    className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
                <label>Повідомлення (необов'язково)</label>
                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Ваш коментар або побажання"
                    rows="3"
                />
            </div>

            <div className="form-group">
                <label>Тестовий спосіб оплати *</label>
                <select
                    name="mock_card_number"
                    value={formData.mock_card_number}
                    onChange={handleChange}
                    required
                >
                    <option value="4242424242424242">Успішна оплата (4242...)</option>
                    <option value="4000000000000002">Відмова в оплаті (4000...)</option>
                    <option value="5555555555554444">Тестова Mastercard (5555...)</option>
                </select>
                <p className="hint">Це тестова система, реальні гроші не списуються</p>
            </div>

            <div className="form-actions">
                <button type="submit" className="submit-button">
                    Підтвердити донат
                </button>
                <button 
                    type="button" 
                    className="cancel-button"
                    onClick={onCancel}
                >
                    Скасувати
                </button>
            </div>
        </form>
    );
};

export default DonationForm;