import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./FundraisingCard.css";

const FundraisingCard = ({ 
    id, 
    title = 'Без назви', 
    category = 'other', 
    image, 
    donationLink,
    currentAmount = 0,
    goalAmount = 0,
    onDelete,
    isOwner = false,
    createdAt,
    showFullInfo = false,
    status = '',
    location,
    urgency,
    complaintsCount = 0 // 👈 додано
}) => {
    const [displayAmount, setDisplayAmount] = useState(currentAmount);
    const [progress, setProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [imageError, setImageError] = useState(false);
    const animationRef = useRef(null);

    useEffect(() => {
        const initialProgress = goalAmount > 0 ? 
            Math.min(100, (currentAmount / goalAmount) * 100) : 0;
        setProgress(initialProgress);
        setDisplayAmount(currentAmount);
    }, [currentAmount, goalAmount]);

    const getDefaultImage = (cat) => {
        const categoryMap = {
            health: '/images/defaults/health.png',
            social: '/images/defaults/social.png',
            education: 'images/defaults/education.png',
            ecology: '/images/defaults/ecology.png',
            other: '/images/defaults/other.png'
        };
        return categoryMap[cat] || '/images/defaults/other.png';
    };

    const getCategoryLabel = (cat) => {
        const categories = {
            health: "Здоров'я",
            social: "Соц.допомога",
            education: "Освіта",
            ecology: "Екологія",
            other: "Інше"
        };
        return categories[cat] || cat;
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('uk-UA', options);
    };
    
    const computedStatus = (status === 'active' && complaintsCount >= 3) ? 'paused' : status;

    const getStatusBadge = () => {
        const statusMap = {
          'pending': { text: 'На модерації', class: 'pending' },
          'active': { text: 'Активний', class: 'active' },
          'paused': { 
            text: 'Призупинено', 
            class: 'paused',
            tooltip: 'Збір призупинено через численні скарги' 
          },
          'completed': { text: 'Завершено', class: 'completed' },
          'cancelled': { 
            text: 'Скасовано', 
            class: 'cancelled',
            tooltip: 'Збір скасовано модератором' 
          }
        };
        
        const statusInfo = statusMap[status] || {};
        if (!statusInfo.text) return null;
        
        return (
          <div className={`status-badge ${statusInfo.class}`} title={statusInfo.tooltip}>
            {statusInfo.text}
          </div>
        );
      };

    const getUrgencyBadge = () => {
        if (!urgency) return null;
        const urgencyMap = {
            'high': { text: 'Терміново', class: 'high' },
            'medium': { text: 'Середня', class: 'medium' },
            'low': { text: 'Не терміново', class: 'low' }
        };
        const urgencyInfo = urgencyMap[urgency] || { text: '', class: '' };
        return urgencyInfo.text ? (
            <div className={`urgency-badge ${urgencyInfo.class}`}>
                {urgencyInfo.text}
            </div>
        ) : null;
    };

    const getImageUrl = () => {
        if (imageError || !image) return getDefaultImage(category);
        if (typeof image === 'string') {
            if (image.startsWith('http')) return image;
            if (image.startsWith('/media/')) return `${process.env.REACT_APP_API_URL}${image}`;
            return image;
        }
        return getDefaultImage(category);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Ви впевнені, що хочете видалити цей збір?")) {
            onDelete(id);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getProgressTextColor = () => {
        return progress < 50 ? '#333' : '#fff';
    };

    return (
        <div className="fundraising-card">
            <div className="image-container">
                <div className="image-fixed-ratio">
                    <img 
                        src={getImageUrl()} 
                        alt={title}
                        onError={handleImageError}
                        loading="lazy"
                    />
                </div>
                <div className="category-badge">
                    {getCategoryLabel(category)}
                </div>
                {getStatusBadge()}
                {getUrgencyBadge()}
            </div>
            
            <div className="card-content">
                <div className="card-header">
                    <h3>{title}</h3>
                    {createdAt && <span className="creation-date">{formatDate(createdAt)}</span>}
                </div>
                
                {location && (
                    <div className="card-location">
                        <i className="location-icon">📍</i> {location}
                    </div>
                )}
                
                <div className="progress-container">
                    <div 
                        className="progress-bar" 
                        style={{ 
                            width: `${progress}%`,
                            backgroundColor: progress >= 100 ? '#4CAF50' : '#2196F3'
                        }}
                    />
                    <span 
                        className="progress-percentage"
                        style={{
                            color: getProgressTextColor(),
                            textShadow: progress < 50 ? 
                                '0 0 3px rgba(255, 255, 255, 0.7)' : 
                                '0 0 3px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {Math.round(progress)}%
                    </span>
                </div>
                
                <div className="amount-display">
                    <div className="amount-item">
                        <span className="amount-label">Зібрано:</span>
                        <span className="amount-value collected">
                            {formatAmount(displayAmount)}
                        </span>
                    </div>
                    
                    {showFullInfo && (
                        <>
                            <div className="amount-item">
                                <span className="amount-label">Ціль:</span>
                                <span className="amount-value goal">
                                    {formatAmount(goalAmount)}
                                </span>
                            </div>
                            <div className="amount-item">
                                <span className="amount-label">Залишилось:</span>
                                <span className="amount-value remaining">
                                    {formatAmount(Math.max(0, goalAmount - displayAmount))}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="card-buttons">
                    <Link 
                        to={`/fundraiser/${id}`} 
                        className="details-button"
                        aria-label={`Детальніше про ${title}`}
                    >
                        Детальніше
                    </Link>
                    
                    {donationLink && computedStatus === 'active' && (
                        <a 
                            href={donationLink} 
                            className="donate_button" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            aria-label="Підтримати цей збір"
                        >
                            Підтримати
                        </a>
                    )}
                    
                    {isOwner && (
                        <div className="owner-buttons">
                            <Link 
                                to={`/fundraiser/${id}/edit`}
                                className="edit-button"
                                aria-label="Редагувати збір"
                            >
                                Редагувати
                            </Link>
                            <button 
                                onClick={handleDelete} 
                                className="delete-button"
                                aria-label="Видалити збір"
                            >
                                Видалити
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FundraisingCard;
