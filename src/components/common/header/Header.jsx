import React, { useContext, useState } from "react";
import { Link } from "react-router-dom"; // Додаємо Link для навігації
import { ThemeContext } from "../../../ThemeContext";
import "./Header.css";

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className={`header ${theme === "dark" ? "theme-dark" : ""}`}>
      {/* Логотип (тепер як посилання) */}
      <Link to="/" className="logo" onClick={closeMenu}>
        <span className="logo-green">3</span>
        <span className="logo-black">boration</span>
      </Link>

      {/* Бургер-іконка */}
      <div className="burger-icon" onClick={toggleMenu}>
        ☰
      </div>

      {/* Навігація */}
      <nav className={`nav-menu ${isOpen ? "open" : ""}`}>
        {/* Тумблер темної теми */}
        <div className="theme-switch" onClick={toggleTheme}>
          <div className={`switch ${theme === "dark" ? "dark-mode" : ""}`}>
            <span className="switch-circle"></span>
          </div>
        </div>

        {/* Використовуємо Link з передачею state */}
        <Link to="/login" state={{ isLogin: true }} onClick={closeMenu}>Увійти</Link>
        <Link to="/register" state={{ isLogin: false }} onClick={closeMenu}>Зареєструватися</Link>
        {/* Видалено "Підтримати проект" */}
        {/* <Link to="/support" onClick={closeMenu}>Підтримати проект</Link> */}
      </nav>
    </header>
  );
}

export default Header;
