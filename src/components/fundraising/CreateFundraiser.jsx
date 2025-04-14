import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateFundraiser.css';

const CreateFundraiser = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal_amount: '',
        donation_link: '',
        evidence: '',
        evidence_link: '',
        category: 'other',
        creator_name: '',
        contact_info: ''
    });
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdFundraiserId, setCreatedFundraiserId] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [useCustomContact, setUseCustomContact] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/login', { state: { from: '/create-fundraiser' } });
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setUserData(response.data);
                // Set default contact info
                setFormData(prev => ({
                    ...prev,
                    creator_name: response.data.full_name || response.data.username,
                    contact_info: response.data.email + (response.data.phone_number ? `, ${response.data.phone_number}` : '')
                }));
            } catch (err) {
                console.error('Failed to fetch user data:', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login', { state: { from: '/create-fundraiser' } });
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
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Розмір файлу доказів не повинен перевищувати 5MB');
                return;
            }
            setEvidenceFile(file);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Розмір зображення не повинен перевищувати 10MB');
                return;
            }
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const parsedGoalAmount = parseFloat(formData.goal_amount);
        if (isNaN(parsedGoalAmount)) {
            setError('Цільова сума повинна бути числом');
            return;
        }
        if (parsedGoalAmount <= 0) {
            setError('Цільова сума повинна бути більше нуля');
            return;
        }

        const data = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                data.append(key, value);
            }
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

            setError(null);
            setCreatedFundraiserId(response.data.id || null);
            setShowSuccessModal(true);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login', { state: { from: '/create-fundraiser' } });
            } else {
                setError(err.response?.data?.message || err.response?.data || 'Сталася помилка при створенні збору');
                setShowSuccessModal(false);
            }
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
            category: 'other',
            creator_name: userData?.full_name || userData?.username || '',
            contact_info: userData?.email + (userData?.phone_number ? `, ${userData.phone_number}` : '')
        });
        setEvidenceFile(null);
        setImage(null);
        setShowSuccessModal(false);
    };

    const handleCreateAnother = () => {
        resetForm();
    };

    const handleViewFundraiser = () => {
        if (createdFundraiserId) {
            navigate(`/fundraiser/${createdFundraiserId}`);
        } else {
            navigate('/fundraisers');
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading-spinner"></div>
                <p>Завантаження даних...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="container error">
                <p>Будь ласка, увійдіть в систему для створення збору</p>
                <button 
                    className="login-button"
                    onClick={() => navigate('/login', { state: { from: '/create-fundraiser' } })}
                >
                    Увійти
                </button>
            </div>
        );
    }

    return (
        <div className="container" id="createFundraiser">
            <h2 className="text">Створити новий збір</h2>
            {error && <p className="error-message">{error}</p>}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="success-modal-overlay">
                    <div className="success-modal">
                        <div className="success-modal-header">
                            <svg className="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 4L12 14.01L9 11.01" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h3>Збір успішно створено!</h3>
                        </div>
                        <div className="success-modal-body">
                            <p>Ваш збір успішно створено та розміщено на платформі. Що бажаєте зробити далі?</p>
                        </div>
                        <div className="success-modal-footer">
                            <button className="primary-button" onClick={handleViewFundraiser}>
                                Переглянути збір
                            </button>
                            <button className="secondary-button" onClick={handleCreateAnother}>
                                Створити ще один збір
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="fundraiser-form" encType="multipart/form-data">
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
                    <label className="checkbox-container">
                        Використати інші контактні дані
                        <input
                            type="checkbox"
                            checked={useCustomContact}
                            onChange={() => setUseCustomContact(!useCustomContact)}
                        />
                        <span className="checkmark"></span>
                    </label>

                    {!useCustomContact ? (
                        <>
                            <div className="form-group">
                                <label>Ім'я організатора</label>
                                <input
                                    type="text"
                                    value={formData.creator_name}
                                    readOnly
                                    className="readonly"
                                />
                            </div>
                            <div className="form-group">
                                <label>Контакти</label>
                                <input
                                    type="text"
                                    value={formData.contact_info}
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
                            step="any"
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
                    <div className="form-group file-upload-group">
                        <label>Файл доказів (PDF, JPG, PNG до 5MB)</label>
                        {evidenceFile ? (
                            <div className="file-info new-file">
                                <div className="file-preview">
                                    <span className="file-link">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M14 2V8H20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 13H8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 17H8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M10 9H9H8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span>{evidenceFile.name}</span>
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={() => setEvidenceFile(null)}
                                        className="remove-button"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6 6L18 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="file-upload-label">
                                <div className="file-upload-design">
                                    <svg className="file-upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 10V14H17V10H19V14C19 15.1 18.1 16 17 16H7C5.9 16 5 15.1 5 14V10H7ZM12 15L16 11H13V5H11V11H8L12 15ZM12 4C12.5523 4 13 3.55228 13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3C11 3.55228 11.4477 4 12 4Z" fill="currentColor"/>
                                    </svg>
                                    <span className="file-upload-text">
                                        <span className="main-text">Завантажити файл доказів</span>
                                        <span className="hint-text">PDF, JPG, PNG (макс. 5MB)</span>
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="file-upload-input"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h3>Зображення для збору</h3>
                    <div className="form-group file-upload-group">
                        <label>Зображення (JPG, PNG до 10MB)</label>
                        {image ? (
                            <div className="file-info new-file">
                                <div className="file-preview">
                                    <span className="file-link">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M21 15L16 10L5 21" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 10L19 7L21 9L16 14" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span>{image.name}</span>
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={() => setImage(null)}
                                        className="remove-button"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6 6L18 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="file-upload-label">
                                <div className="file-upload-design">
                                    <svg className="picture-icon" xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24">
                                        <path d="m12,21c0,.553-.448,1-1,1h-6c-2.757,0-5-2.243-5-5V5C0,2.243,2.243,0,5,0h12c2.757,0,5,2.243,5,5v6c0,.553-.448,1-1,1s-1-.447-1-1v-6c0-1.654-1.346-3-3-3H5c-1.654,0-3,1.346-3,3v6.959l2.808-2.808c1.532-1.533,4.025-1.533,5.558,0l5.341,5.341c.391.391.391,1.023,0,1.414-.195.195-.451.293-.707.293s-.512-.098-.707-.293l-5.341-5.341c-.752-.751-1.976-.752-2.73,0l-4.222,4.222v2.213c0,1.654,1.346,3,3,3h6c.552,0,1,.447,1,1ZM15,3.5c1.654,0,3,1.346,3,3s-1.346,3-3,3-3-1.346-3-3,1.346-3,3-3Zm0,2c-.551,0-1,.448-1,1s.449,1,1,1,1-.448,1-1-.449-1-1-1Zm8,12.5h-3v-3c0-.553-.448-1-1-1s-1,.447-1,1v3h-3c-.552,0-1,.447-1,1s.448,1,1,1h3v3c0,.553.448,1,1,1s1-.447,1-1v-3h3c.552,0,1-.447,1-1s-.448-1-1-1Z"/>
                                    </svg>
                                    <span className="file-upload-text">
                                        <span className="main-text">Завантажити зображення</span>
                                        <span className="hint-text">JPG, PNG (макс. 10MB)</span>
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="file-upload-input"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-button">
                        Створити збір
                    </button>
                    <button 
                        type="reset" 
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