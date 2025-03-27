import React, { useState } from 'react';
import axios from 'axios';
import './CreateFundraiser.css'; 

const CreateFundraiser = () => {
    const [title, setTitle] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [description, setDescription] = useState('');
    const [goalAmount, setGoalAmount] = useState('');
    const [donationLink, setDonationLink] = useState('');
    const [evidence, setEvidence] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [evidenceLink, setEvidenceLink] = useState('');
    const [category, setCategory] = useState('other');
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        setEvidenceFile(e.target.files[0]);
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isNaN(goalAmount) || goalAmount <= 0) {
            setError('Цільова сума повинна бути числом більше за нуль');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('creator_name', creatorName);
        formData.append('contact_info', contactInfo);
        formData.append('description', description);
        formData.append('goal_amount', goalAmount);
        formData.append('donation_link', donationLink);
        formData.append('evidence', evidence);
        formData.append('category', category);
        formData.append('evidence_link', evidenceLink);
        
        if (evidenceFile) {
            formData.append('evidence_file', evidenceFile);
        }

        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/fundraisers/create/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess(true);
            setError(null);
            console.log('Успішно створено:', response.data);
            // Очищаємо форму після успішного створення
            setTitle('');
            setCreatorName('');
            setContactInfo('');
            setDescription('');
            setGoalAmount('');
            setDonationLink('');
            setEvidence('');
            setEvidenceFile(null);
            setEvidenceLink('');
            setCategory('other');
            setImage(null);
        } catch (err) {
            setError(err.response?.data || 'Сталася помилка');
            setSuccess(false);
        }
    };

    return (
        <div className="container" id="createFundraiser">
            <h2>Створити новий збір</h2>
            {success && <p className="success">Збір успішно створено!</p>}
            {error && <p className="error">{JSON.stringify(error)}</p>}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label className="input-label">Назва збору</label>
                    <input 
                        type="text" 
                        placeholder="Введіть назву збору" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                        className="input" 
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Ім'я організатора</label>
                    <input 
                        type="text" 
                        placeholder="Введіть ваше ім'я" 
                        value={creatorName} 
                        onChange={(e) => setCreatorName(e.target.value)} 
                        required 
                        className="input" 
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Контактна інформація</label>
                    <input 
                        type="email" 
                        placeholder="Введіть ваш email" 
                        value={contactInfo} 
                        onChange={(e) => setContactInfo(e.target.value)} 
                        required 
                        className="input" 
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Опис збору</label>
                    <textarea 
                        placeholder="Детально опишіть мету збору" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required 
                        className="textarea" 
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Цільова сума</label>
                    <input 
                        type="number" 
                        placeholder="Введіть необхідну суму" 
                        value={goalAmount} 
                        onChange={(e) => setGoalAmount(e.target.value)} 
                        required 
                        className="input" 
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Посилання на донати (опціонально)</label>
                    <input 
                        type="url" 
                        placeholder="https://example.com/donate" 
                        value={donationLink} 
                        onChange={(e) => setDonationLink(e.target.value)} 
                        className="input" 
                    />
                </div>

                <div className="form-group">
                    <label className="input-label">Текстовий доказ (опціонально)</label>
                    <textarea 
                        placeholder="Додаткова інформація для підтвердження" 
                        value={evidence} 
                        onChange={(e) => setEvidence(e.target.value)} 
                        className="textarea" 
                    />
                </div>

                {/* Evidence File Upload with improved styling */}
                <div className="file-input-container evidence-file-container">
                    <label className="file-input-label">Файл-доказ (опціонально)</label>
                    <div className="file-input-wrapper">
                        <span className="file-input-icon">📋</span>
                        <span className="file-input-text">Натисніть тут, щоб завантажити документ-доказ</span>
                        <span className="file-input-text small">Підтримувані формати: PDF, DOC, DOCX, JPG, PNG</span>
                        <input 
                            type="file" 
                            className="file-input" 
                            onChange={handleFileChange} 
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        {evidenceFile && (
                            <span className="file-input-selected">
                                Обрано файл: {evidenceFile.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="input-label">Посилання на доказ (опціонально)</label>
                    <input 
                        type="url" 
                        placeholder="https://example.com/evidence" 
                        value={evidenceLink} 
                        onChange={(e) => setEvidenceLink(e.target.value)} 
                        className="input" 
                    />
                </div>
                
                <div className="form-group">
                    <label className="input-label">Категорія</label>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        className="select"
                    >
                        <option value="health">Здоров'я</option>
                        <option value="social">Соціальна допомога</option>
                        <option value="education">Освіта та наука</option>
                        <option value="ecology">Екологія та тварини</option>
                        <option value="other">Інше</option>
                    </select>
                </div>
                
                {/* Image Upload with improved styling */}
                <div className="file-input-container image-file-container">
                    <label className="file-input-label">Зображення для збору</label>
                    <div className="file-input-wrapper">
                        <span className="file-input-icon">🖼️</span>
                        <span className="file-input-text">Натисніть тут, щоб завантажити зображення</span>
                        <span className="file-input-text small">Рекомендовані розміри: 1200 × 630 пікселів</span>
                        <input 
                            type="file" 
                            className="file-input" 
                            onChange={handleImageChange} 
                            accept="image/*"
                        />
                        {image && (
                            <span className="file-input-selected">
                                Обрано файл: {image.name}
                            </span>
                        )}
                    </div>
                </div>
                
                <button type="submit" className="button">Створити</button>
            </form>
        </div>
    );
};

export default CreateFundraiser;