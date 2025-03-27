import React from "react";
import { Link } from "react-router-dom";
import "./FundraisingCard.css";

const categoryTranslations = {
  "Здоров'я": "health",
  "Соціальна допомога": "social",
  "Освіта та наука": "education",
  "Екологія та тварини": "ecology",
  "Інше": "other",
};

const FundraisingCard = ({ id, title, category, description, image, donationLink }) => {
  const categoryPath = categoryTranslations[category] || "other";

  const imageUrl = image ? (image.startsWith("http") ? image : `http://127.0.0.1:8000${image}`) : null;

  return (
    <div className="fundraising-card">
      {imageUrl && <img src={imageUrl} alt={title} className="fundraising-image" />}
      <h3>{title}</h3>
      <Link to={`/category/${categoryPath}`} className="category-link">
        <p className="category">{category}</p>
      </Link>
      <p className="description">{description}</p>
      <div className="card-buttons">
        <Link to={`/fundraiser/${id}`} className="details-button">Детальніше</Link>
        {donationLink && (
          <a href={donationLink} className="donate-button" target="_blank" rel="noopener noreferrer">
            Зробити внесок
          </a>
        )}
      </div>
    </div>
  );
};

export default FundraisingCard;
