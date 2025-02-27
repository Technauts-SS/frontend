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
                <input type="text" placeholder="Назва збору" value={title} onChange={(e) => setTitle(e.target.value)} required className="input" />
                <input type="text" placeholder="Ім'я організатора" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} required className="input" />
                <input type="email" placeholder="Контактна інформація" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required className="input" />
                <textarea placeholder="Опис" value={description} onChange={(e) => setDescription(e.target.value)} required className="textarea" />
                <input type="number" placeholder="Цільова сума" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required className="input" />
                <input type="url" placeholder="Посилання на донати (опціонально)" value={donationLink} onChange={(e) => setDonationLink(e.target.value)} className="input" />
                <textarea placeholder="Текстовий доказ (опціонально)" value={evidence} onChange={(e) => setEvidence(e.target.value)} className="textarea" />
                <input type="file" onChange={handleFileChange} className="file-input" />
                <input type="url" placeholder="Посилання на доказ (опціонально)" value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} className="input" />
                
                {/* Випадаючий список для категорії */}
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                    <option value="health">Здоров'я</option>
                    <option value="social">Соціальна допомога</option>
                    <option value="education">Освіта та наука</option>
                    <option value="ecology">Екологія та тварини</option>
                    <option value="other">Інше</option>
                </select>
                
                {/* Завантаження зображення */}
                <input type="file" onChange={handleImageChange} className="file-input" />
                
                <button type="submit" className="button">Створити</button>
            </form>
        </div>
    );
};

export default CreateFundraiser;
