import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";
import "../components/FilterPanel.css";

const FilterPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    helpType: searchParams.get('helpType') || '',
    urgency: searchParams.get('urgency') || ''
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme } = useContext(ThemeContext);
  
  // Extract category from path if present
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const categoryFromPath = pathParts.length > 2 && pathParts[2] ? pathParts[2] : '';
    
    if (categoryFromPath && !filters.category) {
      setFilters(prev => ({
        ...prev,
        category: categoryFromPath
      }));
    }
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleResetFilters = () => {
    // Reset all filters
    setFilters({
      category: '',
      location: '',
      helpType: '',
      urgency: ''
    });
    
    // Navigate to base category page
    navigate('/category', { replace: true });
    
    // Clear search params explicitly
    setSearchParams({});
    
    // Dispatch the event after a short delay to ensure state updates have been processed
    setTimeout(() => {
      console.log("Dispatching filtersCleared event");
      window.dispatchEvent(new CustomEvent('filtersCleared'));
    }, 50);
  };

  const handleSelectChange = (field, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [field]: value
    }));
    
    // If changing category filter, update URL path as well
    if (field === 'category' && value) {
      navigate(`/category/${value}`);
    } else if (field === 'category' && !value) {
      navigate('/category');
    }
  };

  const FilterSelect = ({ label, field, options }) => (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <div className="select-wrapper">
        <select
          value={filters[field]}
          onChange={(e) => handleSelectChange(field, e.target.value)}
          className="filter-select"
        >
          <option value="">Всі {label.toLowerCase()}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <i className="icon-chevron"></i>
      </div>
    </div>
  );

  return (
    <div className={`filter-container ${theme}`}>
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <i className={`icon-filter ${isExpanded ? 'icon-rotate' : ''}`}></i>
          Фільтрація
          <span className="filter-count">
            {Object.values(filters).filter(Boolean).length > 0 &&
              ` (${Object.values(filters).filter(Boolean).length})`}
          </span>
        </h3>
      </div>

      <div className={`filter-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="filter-grid">
          <FilterSelect
            label="Категорія"
            field="category"
            options={[
              { value: 'health', label: "Здоров'я" },
              { value: 'social', label: "Соціальна допомога" },
              { value: 'education', label: "Освіта та наука" },
              { value: 'ecology', label: "Екологія та тварини" },
              { value: 'other', label: "Інше" }
            ]}
          />
          <FilterSelect
            label="Локація"
            field="location"
            options={[
              { value: 'kyiv', label: 'Київ' },
              { value: 'lviv', label: 'Львів' },
              { value: 'kharkiv', label: 'Харків' },
              { value: 'odesa', label: 'Одеса' }
            ]}
          />
          <FilterSelect
            label="Тип допомоги"
            field="helpType"
            options={[
              { value: 'money', label: 'Фінансова допомога' },
              { value: 'volunteer', label: 'Волонтерська допомога' }
            ]}
          />
        </div>

        <div className="filter-actions">
          <button
            className={`reset-btn ${!Object.values(filters).some(Boolean) ? 'disabled' : ''}`}
            onClick={handleResetFilters}
            disabled={!Object.values(filters).some(Boolean)}
          >
            <i className="icon-reset"></i>
            Очистити фільтри
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;