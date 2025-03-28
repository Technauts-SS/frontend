import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./FundraiserDetail.css";

const FundraiserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fundraiser, setFundraiser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Перевірка коректності ID перед запитом
        if (!id || isNaN(id)) {
            setError('Невірний ідентифікатор збору');
            setLoading(false);
            toast.error('Невірний ідентифікатор збору');
            navigate('/');
            return;
        }

        const fetchFundraiser = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/fundraisers/${id}/`);
                
                if (!response.data) {
                    throw new Error('Збір не знайдено');
                }

                setFundraiser(response.data);
            } catch (error) {
                console.error('Помилка завантаження збору:', error);
                setError(error.response?.data?.message || 'Не вдалося завантажити збір');
                toast.error(error.response?.data?.message || 'Не вдалося завантажити збір');
                
                // Перенаправлення на головну через 3 секунди
                setTimeout(() => navigate('/'), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchFundraiser();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Завантаження даних збору...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">{error}</p>
                <p>Перенаправлення на головну сторінку...</p>
            </div>
        );
    }

    // Форматування суми
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', { 
            style: 'currency', 
            currency: 'UAH' 
        }).format(amount);
    };

    return (
        <div className="fundraiser-detail">
            <div className="fundraiser-header">
                <img 
                    src={fundraiser.image ? 
                        (fundraiser.image.startsWith('http') ? 
                            fundraiser.image : 
                            `http://127.0.0.1:8000${fundraiser.image}`) : 
                        '/default-image.jpg'} 
                    alt={fundraiser.title} 
                    className="fundraiser-image"
                    onError={(e) => {
                        e.target.src = '/default-image.jpg';
                    }}
                />
                <div className="fundraiser-meta">
                    <h1>{fundraiser.title}</h1>
                    <div className="fundraiser-creator">
                        <span className="meta-label">Організатор:</span>
                        <span>{fundraiser.creator_name || 'Невідомий організатор'}</span>
                    </div>
                    <div className="fundraiser-progress">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${(fundraiser.current_amount / fundraiser.goal_amount) * 100}%` }}
                            ></div>
                        </div>
                        <div className="amounts">
                            <span>{formatAmount(fundraiser.current_amount)}</span>
                            <span>{formatAmount(fundraiser.goal_amount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fundraiser-content">
                <div className="fundraiser-description">
                    <h3>Про збір</h3>
                    <p>{fundraiser.description}</p>
                </div>

                <div className="fundraiser-contacts">
                    <h3>Контактна інформація</h3>
                    <p><strong>Контактна особа:</strong> {fundraiser.contact_info}</p>
                    {fundraiser.phone_number && (
                        <p><strong>Телефон:</strong> {fundraiser.phone_number}</p>
                    )}
                </div>

                {fundraiser.donation_link && (
                    <div className="donation-section">
                        <a 
                            href={fundraiser.donation_link} 
                            className="donate-button" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Підтримати збір
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FundraiserDetail;