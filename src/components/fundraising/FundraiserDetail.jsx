import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    const [isOwner, setIsOwner] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getDefaultImage = (category) => {
        const categoryMap = {
            health: '/images/defaults/health.png',
            social: '/images/defaults/social.png',
            education: '/images/defaults/education.png',
            ecology: '/images/defaults/ecology.png',
            other: '/images/defaults/other.png'
        };
        return categoryMap[category] || '/images/defaults/other.png';
    };

    const getImageUrl = () => {
        if (imageError || !fundraiser?.image) return getDefaultImage(fundraiser?.category);
        if (fundraiser.image.startsWith('http')) return fundraiser.image;
        if (fundraiser.image.startsWith('/uploads/')) return `http://127.0.0.1:8000${fundraiser.image}`;
        return fundraiser.image;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('uk-UA', options);
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', { 
            style: 'currency', 
            currency: 'UAH',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getCategoryLabel = (category) => {
        const categories = {
            health: "Здоров'я",
            social: "Соц.допомога",
            education: "Освіта",
            ecology: "Екологія",
            other: "Інше"
        };
        return categories[category] || category;
    };

    useEffect(() => {
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
                
                const userId = localStorage.getItem('userId');
                setIsOwner(userId && userId === response.data.creator_id?.toString());
            } catch (error) {
                console.error('Помилка завантаження збору:', error);
                const errorMessage = error.response?.data?.message || 
                                  error.message || 
                                  'Не вдалося завантажити збір';
                setError(errorMessage);
                toast.error(errorMessage);
                
                setTimeout(() => navigate('/'), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchFundraiser();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (window.confirm("Ви впевнені, що хочете видалити цей збір?")) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/fundraisers/${id}/`);
                toast.success('Збір успішно видалено');
                navigate('/');
            } catch (error) {
                console.error('Помилка видалення:', error);
                toast.error(error.response?.data?.message || 'Не вдалося видалити збір');
            }
        }
    };

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

    const progressPercentage = Math.min(
        100, 
        (fundraiser.current_amount / fundraiser.goal_amount) * 100
    );

    return (
        <div className="fundraiser-detail">
            <div className="fundraiser-header">
                <div className="image-container">
                    <img 
                        src={getImageUrl()}
                        alt={fundraiser.title}
                        className={`fundraiser-image ${imageError || !fundraiser.image ? 'fallback' : ''}`}
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                    <div className="category-badge">
                        {getCategoryLabel(fundraiser.category)}
                    </div>
                </div>

                <div className="fundraiser-meta">
                    <div className="title-section">
                        <h1>{fundraiser.title}</h1>
                        {isOwner && (
                            <div className="owner-actions">
                                <Link 
                                    to={`/fundraiser/${id}/edit`}
                                    className="edit-button"
                                >
                                    Редагувати
                                </Link>
                                <button 
                                    onClick={handleDelete}
                                    className="delete-button"
                                >
                                    Видалити
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="fundraiser-creator">
                        <span className="meta-label">Організатор:</span>
                        <span>{fundraiser.creator_name || 'Невідомий організатор'}</span>
                    </div>

                    <div className="fundraiser-date">
                        <span className="meta-label">Дата створення:</span>
                        <span>{formatDate(fundraiser.created_at)}</span>
                    </div>

                    <div className="fundraiser-progress">
                        <div className="progress-container">
                            <div 
                                className="progress-bar" 
                                style={{ 
                                    width: `${progressPercentage}%`,
                                    backgroundColor: progressPercentage >= 100 ? '#4CAF50' : '#2196F3'
                                }}
                            ></div>
                            <span className="progress-percentage">
                                {Math.round(progressPercentage)}%
                            </span>
                        </div>

                        <div className="amounts-display">
                            <div className="amount-item">
                                <span className="amount-label">Зібрано:</span>
                                <span className="amount-value collected">
                                    {formatAmount(fundraiser.current_amount)}
                                </span>
                            </div>
                            <div className="amount-item">
                                <span className="amount-label">Ціль:</span>
                                <span className="amount-value goal">
                                    {formatAmount(fundraiser.goal_amount)}
                                </span>
                            </div>
                            {progressPercentage < 100 && (
                                <div className="amount-item">
                                    <span className="amount-label">Залишилось:</span>
                                    <span className="amount-value remaining">
                                        {formatAmount(fundraiser.goal_amount - fundraiser.current_amount)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fundraiser-content">
                <div className="fundraiser-description">
                    <h2>Про збір</h2>
                    <p>{fundraiser.description}</p>
                </div>

                <div className="fundraiser-contacts">
                    <h2>Контактна інформація</h2>
                    {fundraiser.contact_info && (
                        <p><strong>Контактна особа:</strong> {fundraiser.contact_info}</p>
                    )}
                    {fundraiser.phone_number && (
                        <p><strong>Телефон:</strong> {fundraiser.phone_number}</p>
                    )}
                    {fundraiser.email && (
                        <p><strong>Email:</strong> {fundraiser.email}</p>
                    )}
                </div>

                <div className="action-buttons">
                    {fundraiser.donation_link && (
                        <a 
                            href={fundraiser.donation_link} 
                            className="donate-button" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Підтримати збір
                        </a>
                    )}
                    <Link to="/" className="back-button">
                        Назад до всіх зборів
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FundraiserDetail;