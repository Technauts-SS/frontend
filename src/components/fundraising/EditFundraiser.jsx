import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditFundraiser.css';

const EditFundraiser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
    const [currentImage, setCurrentImage] = useState('');
    const [currentEvidenceFile, setCurrentEvidenceFile] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [useCustomContact, setUseCustomContact] = useState(false);
    const [isImageRemoved, setIsImageRemoved] = useState(false);
    const [isEvidenceRemoved, setIsEvidenceRemoved] = useState(false);

    useEffect(() => {
        const fetchFundraiserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://127.0.0.1:8000/api/fundraisers/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const data = response.data;
                setFormData({
                    title: data.title,
                    description: data.description,
                    goal_amount: data.goal_amount,
                    donation_link: data.donation_link || '',
                    evidence: data.evidence || '',
                    evidence_link: data.evidence_link || '',
                    category: data.category,
                    creator_name: data.creator_name,
                    contact_info: data.contact_info
                });
                
                if (data.image) {
                    setCurrentImage(data.image.startsWith('http') ? data.image : `http://127.0.0.1:8000${data.image}`);
                }
                
                if (data.evidence_file) {
                    setCurrentEvidenceFile(data.evidence_file.startsWith('http') ? data.evidence_file : `http://127.0.0.1:8000${data.evidence_file}`);
                }
                
                // Check if custom contacts are being used
                const userResponse = await axios.get('http://127.0.0.1:8000/api/users/me/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                const userData = userResponse.data;
                
                const isUsingCustomContacts = 
                    data.creator_name !== (userData.full_name || userData.username) || 
                    !data.contact_info.includes(userData.email);
                
                setUseCustomContact(isUsingCustomContacts);
                
            } catch (err) {
                console.error('Failed to fetch fundraiser data:', err);
                setError('Не вдалося завантажити дані збору');
                navigate('/my-fundraisers');
            } finally {
                setLoading(false);
            }
        };
        
        fetchFundraiserData();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Розмір файлу доказів не повинен перевищувати 5MB');
                return;
            }
            setEvidenceFile(file);
            setIsEvidenceRemoved(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError('Розмір зображення не повинен перевищувати 10MB');
                return;
            }
            setImage(file);
            setIsImageRemoved(false);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setCurrentImage('');
        setIsImageRemoved(true);
    };

    const handleRemoveEvidenceFile = () => {
        setEvidenceFile(null);
        setCurrentEvidenceFile('');
        setIsEvidenceRemoved(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const parsedGoalAmount = parseFloat(formData.goal_amount);
        if (isNaN(parsedGoalAmount)) {
            setError('Цільова сума повинна бути числом');
            return;
        }

        const data = new FormData();
        
        // Add all form fields
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                data.append(key, value);
            }
        });
        
        data.append('goal_amount', parsedGoalAmount);
        
        // Handle contact info based on user choice
        if (!useCustomContact) {
            const token = localStorage.getItem('token');
            const userResponse = await axios.get('http://127.0.0.1:8000/api/users/me/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            const userData = userResponse.data;
            
            data.append('creator_name', userData.full_name || userData.username);
            data.append('contact_info', userData.email);
            if (userData.phone_number) {
                data.append('contact_info', `${userData.email}, ${userData.phone_number}`);
            }
        }

        // Handle image
        if (image) {
            data.append('image', image);
        } else if (isImageRemoved) {
            data.append('remove_image', 'true');
        }

        // Handle evidence file
        if (evidenceFile) {
            data.append('evidence_file', evidenceFile);
        } else if (isEvidenceRemoved) {
            data.append('remove_evidence_file', 'true');
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://127.0.0.1:8000/api/fundraisers/${id}/update/`,
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
            
            // Update image and evidence file URLs after successful update
            if (response.data.image) {
                setCurrentImage(response.data.image.startsWith('http') ? 
                    response.data.image : 
                    `http://127.0.0.1:8000${response.data.image}`);
                setIsImageRemoved(false);
            } else {
                setCurrentImage('');
            }
            
            if (response.data.evidence_file) {
                setCurrentEvidenceFile(response.data.evidence_file.startsWith('http') ? 
                    response.data.evidence_file : 
                    `http://127.0.0.1:8000${response.data.evidence_file}`);
                setIsEvidenceRemoved(false);
            } else {
                setCurrentEvidenceFile('');
            }
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.message || err.response?.data || 'Сталася помилка при оновленні збору');
            setSuccess(false);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading-spinner"></div>
                <p>Завантаження даних збору...</p>
            </div>
        );
    }

    return (
        <div className="container" id="editFundraiser">
            <h2>Редагувати збір</h2>
            {success && (
                <div className="success-message">
                    <p>Збір успішно оновлено!</p>
                    <button onClick={() => navigate(`/fundraiser/${id}`)}>Перейти до збору</button>
                </div>
            )}
            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit} className="fundraiser-form" encType="multipart/form-data">
                <div className="form-sectionh3">
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

                <div className="form-sectionh3">
                    <h3>Контактна інформація</h3>
                    <lable className="checkbox-container">
                        Використати інші контактні дані
                        <input
                              type="checkbox"
                              id="customContactCheckbox"
                             checked={useCustomContact}
                              onChange={() => setUseCustomContact(!useCustomContact)}
                        />
                        <span classNAme="checkmark"></span>
                 </lable>

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

                <div className="form-sectionh3">
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

                <div className="form-sectionh3">
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
                        {currentEvidenceFile ? (
                            <div className="file-info">
                                Поточний файл: <a 
                                    href={currentEvidenceFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Переглянути
                                </a>
                                <button 
                                    type="button" 
                                    onClick={handleRemoveEvidenceFile}
                                    className="remove-file"
                                >
                                    Видалити
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                        )}
                        {evidenceFile && (
                            <div className="file-info">
                                Новий файл: {evidenceFile.name}
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

                <div className="form-sectionh3">
                    <h3>Зображення для збору</h3>
                    <div className="form-group file-upload">
                        <label>Зображення (JPG, PNG до 10MB)</label>
                        {currentImage ? (
                            <div className="current-image-container">
                                <img 
                                    src={currentImage} 
                                    alt="Поточне зображення збору" 
                                    className="current-image-preview"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    className="remove-image-button"
                                >
                                    Видалити зображення
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        )}
                        {image && (
                            <div className="file-info">
                                Нове зображення: {image.name}
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
                        Оновити збір
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate(`/fundraiser/${id}`)} 
                        className="cancel-button"
                    >
                        Скасувати
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditFundraiser;