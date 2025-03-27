import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateFundraiser.css';

const CreateFundraiser = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal_amount: '',
        donation_link: '',
        evidence: '',
        evidence_link: '',
        category: 'other'
    });
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [useCustomContact, setUseCustomContact] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setUserData(response.data);
            } catch (err) {
                console.error('Failed to fetch user data:', err);
                setError('Не вдалося завантажити дані профілю');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setEvidenceFile(e.target.files[0]);
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const parsedGoalAmount = parseFloat(formData.goal_amount);
        if (isNaN(parsedGoalAmount) || parsedGoalAmount <= 0) {
            setError('Цільова сума повинна бути числом більше за нуль');
            return;
        }

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });
        data.append('goal_amount', parsedGoalAmount);
        
        if (!useCustomContact) {
            data.append('creator_name', userData.full_name || userData.username);
            data.append('contact_info', userData.email);
            if (userData.phone_number) {
                data.append('contact_info', `${userData.email}, ${userData.phone_number}`);
            }
        }

        if (evidenceFile) data.append('evidence_file', evidenceFile);
        if (image) data.append('image', image);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://127.0.0.1:8000/api/fundraisers/create/',
                data,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Token ${token}`,
                    },
                }
            );

            setSuccess(true);
            setError(null);
            resetForm();
        } catch (err) {
            setError(err.response?.data || 'Сталася помилка при створенні збору');
            setSuccess(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            goal_amount: '',
            donation_link: '',
            evidence: '',
            evidence_link: '',
            category: 'other'
        });
        setEvidenceFile(null);
        setImage(null);
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading-spinner"></div>
                <p>Завантаження даних...</p>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="container error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Спробувати знову</button>
            </div>
        );
    }

    return (
        <div className="container" id="createFundraiser">
            <h2>Створити новий збір</h2>
            {success && (
                <div className="success-message">
                    <p>Збір успішно створено!</p>
                    <button onClick={resetForm}>Створити ще один збір</button>
                </div>
            )}
            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit} className="fundraiser-form">
                <div className="form-section">
                    <h3>Основна інформація</h3>
                    <div className="form-group">
                        <label>Назва збору*</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Опис збору*</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Категорія*</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="health">Здоров'я</option>
                            <option value="social">Соціальна допомога</option>
                            <option value="education">Освіта та наука</option>
                            <option value="ecology">Екологія та тварини</option>
                            <option value="other">Інше</option>
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Контактна інформація</h3>
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={useCustomContact}
                                onChange={() => setUseCustomContact(!useCustomContact)}
                            />
                            Використати інші контактні дані
                        </label>
                    </div>

                    {!useCustomContact ? (
                        <>
                            <div className="form-group">
                                <label>Ім'я організатора</label>
                                <input
                                    type="text"
                                    value={userData?.full_name || userData?.username}
                                    readOnly
                                    className="readonly"
                                />
                            </div>
                            <div className="form-group">
                                <label>Контакти</label>
                                <input
                                    type="text"
                                    value={userData?.email + (userData?.phone_number ? `, ${userData.phone_number}` : '')}
                                    readOnly
                                    className="readonly"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Ім'я організатора*</label>
                                <input
                                    type="text"
                                    name="creator_name"
                                    value={formData.creator_name || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Контактна інформація*</label>
                                <input
                                    type="text"
                                    name="contact_info"
                                    value={formData.contact_info || ''}
                                    onChange={handleChange}
                                    required
                                    placeholder="Email або телефон"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="form-section">
                    <h3>Фінансова інформація</h3>
                    <div className="form-group">
                        <label>Цільова сума (₴)*</label>
                        <input
                            type="number"
                            name="goal_amount"
                            value={formData.goal_amount}
                            onChange={handleChange}
                            required
                            min="1"
                        />
                    </div>
                    <div className="form-group">
                        <label>Посилання для донатів (опціонально)</label>
                        <input
                            type="url"
                            name="donation_link"
                            value={formData.donation_link}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Докази</h3>
                    <div className="form-group">
                        <label>Опис доказів (опціонально)</label>
                        <textarea
                            name="evidence"
                            value={formData.evidence}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Посилання на докази (опціонально)</label>
                        <input
                            type="url"
                            name="evidence_link"
                            value={formData.evidence_link}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="form-group file-upload">
                        <label>Файл доказів (PDF, JPG, PNG до 5MB)</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        {evidenceFile && (
                            <div className="file-info">
                                Вибрано: {evidenceFile.name}
                                <button 
                                    type="button" 
                                    onClick={() => setEvidenceFile(null)}
                                    className="remove-file"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h3>Зображення для збору</h3>
                    <div className="form-group file-upload">
                        <label>Зображення (JPG, PNG до 10MB)</label>
                        <input
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                        />
                        {image && (
                            <div className="file-info">
                                Вибрано: {image.name}
                                <button 
                                    type="button" 
                                    onClick={() => setImage(null)}
                                    className="remove-file"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-button">
                        Створити збір
                    </button>
                    <button 
                        type="button" 
                        onClick={resetForm} 
                        className="reset-button"
                    >
                        Очистити форму
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateFundraiser;