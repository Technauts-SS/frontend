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
  onDelete, // Додаємо пропс для функції видалення
  isOwner = false // Показує чи поточний користувач є власником
}) => {
  const imageUrl = image ? (image.startsWith("http") ? image : `http://127.0.0.1:8000${image}`) : null;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (window.confirm("Ви впевнені, що хочете видалити цей збір?")) {
      await onDelete(id);
    }
  };

  return (
    <div className="fundraising-card">
      {imageUrl && (
        <div className="image-container">
          <img src={imageUrl} alt={title} className="fundraising-image" />
          <div className="category-badge">{category}</div>
        </div>
      )}
      <div className="card-content">
        <h3>{title}</h3>
        <p className="description">{description}</p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${Math.random() * 100}%` }}></div>
        </div>
        <div className="card-buttons">
          <Link to={`/fundraiser/${id}`} className="details-button">
            Детальніше
          </Link>
          {donationLink && (
            <a href={donationLink} className="donate-button" target="_blank" rel="noopener noreferrer">
              Підтримати
            </a>
          )}
          {isOwner && (
            <button onClick={handleDelete} className="delete-button">
              Видалити
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundraisingCard;