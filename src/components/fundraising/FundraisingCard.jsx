import React from "react";
import { Link } from "react-router-dom";
import "./FundraisingCard.css";

const FundraisingCard = ({ 
  id, 
  title, 
  category, 
  description, 
  image, 
  donationLink,
  currentAmount = 0,
  goalAmount = 0,
  onDelete,
  isOwner = false,
  createdAt,
  showFullInfo = false
}) => {
  // Функція для отримання дефолтного зображення за категорією
  const getDefaultImage = (cat) => {
    const categoryMap = {
      health: '/images/defaults/health.png',
      social: '/images/defaults/social.png',
      education: '/images/defaults/education.png',
      ecology: '/images/defaults/ecology.png',
      other: '/images/defaults/other.png'
    };
    return categoryMap[cat] || '/images/defaults/other.png';
  };

  // Обробка URL зображення
  const getImageUrl = () => {
    if (!image) return getDefaultImage(category);
    
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads/')) return `http://127.0.0.1:8000${image}`;
    
    return image;
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (window.confirm("Ви впевнені, що хочете видалити цей збір?")) {
      await onDelete(id);
    }
  };

  const progressPercentage = goalAmount > 0 ? 
    Math.min(100, (currentAmount / goalAmount) * 100) : 
    0;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const truncateDescription = (text, maxLength = 80) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const remainingAmount = Math.max(0, goalAmount - currentAmount);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  return (
    <div className="fundraising-card">
      <div className="image-container">
        <img 
          src={getImageUrl()} 
          alt={title} 
          className="fundraising-image"
          onError={(e) => {
            e.target.src = getDefaultImage('other');
            console.error(`Не вдалося завантажити зображення для ${title}`);
          }}
          loading="lazy"
        />
        <div className="category-badge">
          {getCategoryLabel(category)}
        </div>
      </div>
      
      <div className="card-content">
        <div className="card-header">
          <h3>{title}</h3>
          {createdAt && (
            <span className="creation-date">{formatDate(createdAt)}</span>
          )}
        </div>
        
        <p className="description">{truncateDescription(description)}</p>
        
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
        
        <div className="amount-display">
          <div className="amount-item">
            <span className="amount-label">Зібрано:</span>
            <span className="amount-value collected">
              {formatAmount(currentAmount)}
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
              {remainingAmount > 0 && (
                <div className="amount-item">
                  <span className="amount-label">Залишилось:</span>
                  <span className="amount-value remaining">
                    {formatAmount(remainingAmount)}
                  </span>
                </div>
              )}
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
          
          {donationLink && (
            <a 
              href={donationLink} 
              className="donate-button" 
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

// Допоміжна функція для перекладу категорій
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

export default FundraisingCard;