import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DonationForm from './DonationForm';
import "./FundraiserDetail.css";
import api from '../../api';

const FundraiserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fundraiser, setFundraiser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [donations, setDonations] = useState([]);
    const [animatedAmount, setAnimatedAmount] = useState(0);
    const [animatedProgress, setAnimatedProgress] = useState(0);

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
        if (fundraiser.image.startsWith('/media/')) return `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${fundraiser.image}`;
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
            social: "Соціальна допомога",
            education: "Освіта та наука",
            ecology: "Екологія та тварини",
            other: "Інше"
        };
        return categories[category] || category;
    };

    const fetchFundraiserData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Verify token exists
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Необхідно увійти в систему');
            }

            const [fundraiserRes, donationsRes] = await Promise.all([
                api.get(`/fundraisers/${id}/`),
                api.get(`/fundraisers/${id}/donations/`).catch(() => ({ data: [] }))
            ]);
            
            if (!fundraiserRes.data) {
                throw new Error('Збір не знайдено');
            }

            setFundraiser(fundraiserRes.data);
            setDonations(donationsRes.data || []);
            
            // Animation
            animateValue(animatedAmount, fundraiserRes.data.current_amount, setAnimatedAmount);
            
            const newProgress = fundraiserRes.data.goal_amount > 0 ? 
                Math.min(100, (fundraiserRes.data.current_amount / fundraiserRes.data.goal_amount) * 100) : 0;
            animateValue(animatedProgress, newProgress, setAnimatedProgress);
            
            const userId = localStorage.getItem('userId');
            setIsOwner(userId && userId === fundraiserRes.data.creator?.id?.toString());
        } catch (error) {
            console.error('Error fetching data:', error);
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.message || 
                               error.message ||
                               'Не вдалося завантажити дані';
            setError(errorMessage);
            toast.error(errorMessage);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const animateValue = (start, end, setValue) => {
        const duration = 500;
        const startTime = performance.now();
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const fraction = Math.min(elapsed / duration, 1);
            
            setValue(Math.round(start + (end - start) * fraction));
            
            if (fraction < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    };

    useEffect(() => {
        fetchFundraiserData();
        
        const handleFundraiserUpdate = (e) => {
            if (e.detail.id === id) {
                setFundraiser(prev => ({
                    ...prev,
                    current_amount: e.detail.currentAmount
                }));
                animateValue(animatedAmount, e.detail.currentAmount, setAnimatedAmount);
                animateValue(animatedProgress, e.detail.progress, setAnimatedProgress);
            }
        };

        window.addEventListener('fundraiserUpdated', handleFundraiserUpdate);
        return () => {
            window.removeEventListener('fundraiserUpdated', handleFundraiserUpdate);
        };
    }, [id]);

    const handleDonationSubmit = async (donationData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await api.post('/donations/', { 
                ...donationData, 
                campaign: id 
            });
            
            toast.success('Донат успішно здійснено!');
            setShowDonationForm(false);
            await fetchFundraiserData();
            
            window.dispatchEvent(new CustomEvent('fundraiserUpdated', {
                detail: { 
                    id,
                    currentAmount: response.data.campaign.current_amount,
                    progress: (response.data.campaign.current_amount / response.data.campaign.goal_amount) * 100
                }
            }));
        } catch (error) {
            console.error('Donation error:', error);
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.message || 
                               'Помилка при здійсненні донату';
            toast.error(errorMessage);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Ви впевнені, що хочете видалити цей збір?")) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                await api.delete(`/fundraisers/${id}/`);
                toast.success('Збір успішно видалено');
                navigate('/');
            } catch (error) {
                console.error('Помилка видалення:', error);
                const errorMessage = error.response?.data?.detail || 
                                   error.response?.data?.message || 
                                   'Не вдалося видалити збір';
                toast.error(errorMessage);
                
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
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
                {error.includes('увійти') ? (
                    <button 
                        onClick={() => navigate('/login')}
                        className="login-button"
                    >
                        Увійти
                    </button>
                ) : (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="retry-button"
                    >
                        Спробувати знову
                    </button>
                )}
                <Link to="/" className="back-button">
                    На головну
                </Link>
            </div>
        );
    }

    if (!fundraiser) {
        return (
            <div className="error-container">
                <p className="error-message">Збір не знайдено</p>
                <Link to="/" className="back-button">
                    На головну
                </Link>
            </div>
        );
    }

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
                        <span>{fundraiser.creator_name || fundraiser.creator?.full_name || 'Невідомий організатор'}</span>
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
                                    width: `${animatedProgress}%`,
                                    backgroundColor: animatedProgress >= 100 ? '#4CAF50' : '#2196F3',
                                    transition: 'width 0.5s ease, background-color 0.3s ease'
                                }}
                            ></div>
                            <span className="progress-percentage">
                                {Math.round(animatedProgress)}%
                            </span>
                        </div>

                        <div className="amounts-display">
                            <div className="amount-item">
                                <span className="amount-label">Зібрано:</span>
                                <span className="amount-value collected">
                                    {formatAmount(animatedAmount)}
                                </span>
                            </div>
                            <div className="amount-item">
                                <span className="amount-label">Ціль:</span>
                                <span className="amount-value goal">
                                    {formatAmount(fundraiser.goal_amount)}
                                </span>
                            </div>
                            {animatedProgress < 100 && (
                                <div className="amount-item">
                                    <span className="amount-label">Залишилось:</span>
                                    <span className="amount-value remaining">
                                        {formatAmount(fundraiser.goal_amount - animatedAmount)}
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

                {fundraiser.evidence && (
                    <div className="fundraiser-evidence">
                        <h2>Підтвердження</h2>
                        <p>{fundraiser.evidence}</p>
                        {fundraiser.evidence_link && (
                            <a 
                                href={fundraiser.evidence_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="evidence-link"
                            >
                                Посилання на докази
                            </a>
                        )}
                    </div>
                )}

                <div className="donation-section">
                    <h2>Підтримати збір</h2>
                    
                    {!showDonationForm ? (
                        <button 
                            onClick={() => {
                                if (!localStorage.getItem('token')) {
                                    navigate('/login');
                                } else {
                                    setShowDonationForm(true);
                                }
                            }}
                            className="donate-button"
                        >
                            Зробити внесок
                        </button>
                    ) : (
                        <DonationForm 
                            onSubmit={handleDonationSubmit}
                            onCancel={() => setShowDonationForm(false)}
                            campaignId={id}
                        />
                    )}

                    {donations.length > 0 && (
                        <div className="donations-list">
                            <h3>Останні донати</h3>
                            <ul>
                                {donations.slice(0, 5).map(donation => (
                                    <li key={donation.id}>
                                        <span>{formatAmount(donation.amount)}</span>
                                        <span className={`status-${donation.status}`}>
                                            {donation.status === 'success' ? '✓ Успішно' : '✗ Не вдалося'}
                                        </span>
                                        <span>{formatDate(donation.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                            {donations.length > 5 && (
                                <button 
                                    className="show-more"
                                    onClick={() => navigate(`/fundraiser/${id}/donations`)}
                                >
                                    Показати всі
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="action-buttons">
                    <Link to="/" className="back-button">
                        Назад до всіх зборів
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FundraiserDetail;