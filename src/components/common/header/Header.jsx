import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../../../ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import "./Header.css";

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeMenu();
  };

  return (
    <header className={`header ${theme === "dark" ? "theme-dark" : ""}`}>
      <Link to="/" className="logo" onClick={closeMenu}>
        <span className="logo-green">3</span>
        <span className="logo-text">boration</span>
      </Link>

      <div className="burger-icon" onClick={toggleMenu}>
        ☰
      </div>

      <nav className={`nav-menu ${isOpen ? "open" : ""}`}>
        <div className="theme-switch" onClick={toggleTheme}>
          <div className={`switch ${theme === "dark" ? "dark-mode" : ""}`}>
            <span className="switch-circle"></span>
          </div>
        </div>

        {!isAuthenticated ? (
          <>
            <Link
              to="/login"
              onClick={closeMenu}
              className="nav-link"
            >
              Увійти
            </Link>
            <Link
              to="/register"
              onClick={closeMenu}
              className="nav-auth-button"
            >
              Зареєструватися
            </Link>
          </>
        ) : (
          <div className="user-info">
            <Link to="/profile" onClick={closeMenu} className="nav-link">
              {user?.full_name || 'Профіль'}
            </Link>
            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Вийти
            </button>
          </div>
        )}

      </nav>
    </header>
  );
}

export default Header;