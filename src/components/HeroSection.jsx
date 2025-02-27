import { Link, useNavigate } from "react-router-dom";
import "./HeroSection.css";
import healthcareIcon from "../assets/icons/healthcare.png";
import SocialCare from "../assets/icons/social-care.png";
import Books from "../assets/icons/books.png";
import Ecology from "../assets/icons/ecology.png";
import Other from "../assets/icons/other.png";
import ExchangeImage from "../assets/images/exchange-of-kindness.png";

const categories = [
  { icon: healthcareIcon, title: "Здоров'я", path: "health" },
  { icon: SocialCare, title: "Соціальна допомога", path: "social" },
  { icon: Books, title: "Освіта та наука", path: "education" },
  { icon: Ecology, title: "Екологія та тварини", path: "ecology" },
  { icon: Other, title: "Інше", path: "" },
];

const HeroSection = () => {
  const navigate = useNavigate();

  const handleAskForHelpClick = () => {
    navigate('/create-fundraiser');
  };

  const handleHelpOthersClick = () => {
    navigate('/category');
  };

  return (
    <section className="hero">
      {/* Заголовок і картинка */}
      <div className="hero-header">
        <div>
          <h1>Ти можеш змінити світ на краще!</h1>
          <p>Якась інформація про сайт...</p>
        </div>
        <img src={ExchangeImage} alt="Exchange of Kindness" className="exchange-image" />
      </div>

      {/* Категорії */}
      <div className="categories">
        {categories.map((category, index) => (
          <Link key={index} to={`/category/${category.path}`} className="category">
            <img src={category.icon} alt={category.title} />
            <p>{category.title}</p>
          </Link>
        ))}
      </div>

      {/* Кнопки */}
      <div className="hero-buttons">
        <button className="help" onClick={handleAskForHelpClick}>Попросити допомоги</button>
        <button className="support" onClick={handleHelpOthersClick}>Допомогти</button>
      </div>
    </section>
  );
};

export default HeroSection;