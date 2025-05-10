import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";
import "./FilterPanel.css";

const categoryOptions = [
  { value: 'health', label: "Здоров'я" },
  { value: 'social', label: "Соціальна допомога" },
  { value: 'education', label: "Освіта та наука" },
  { value: 'ecology', label: "Екологія та тварини" },
  { value: 'other', label: "Інше" }
];

const cityOptions = [
  { value: 'kyiv', label: 'Київ' },
  { value: 'lviv', label: 'Львів' },
  { value: 'kharkiv', label: 'Харків' },
  { value: 'odesa', label: 'Одеса' },
  { value: 'dnipro', label: 'Дніпро' },
  { value: 'other', label: 'Інше місто' }
];

const statusOptions = [
  { value: 'active', label: 'Активні' },
  { value: 'completed', label: 'Завершені' },
  { value: 'paused', label: 'Призупинені' },
  { value: 'cancelled', label: 'Скасовані' }
];

const urgencyOptions = [
  { value: 'high', label: 'Високий' },
  { value: 'medium', label: 'Середній' },
  { value: 'low', label: 'Низький' }
];

const sortOptions = [
  { value: '-created_at', label: 'Найновіші' },
  { value: 'created_at', label: 'Найстаріші' },
  { value: '-current_amount', label: 'Найбільші збори' },
  { value: 'current_amount', label: 'Найменші збори' },
  { value: '-goal_amount', label: 'Найбільша ціль' },
  { value: 'goal_amount', label: 'Найменша ціль' }
];

const FilterPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    status: searchParams.get('status') || '',
    urgency: searchParams.get('urgency') || '',
    sort: searchParams.get('sort') || '-created_at'
  });
  
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme } = useContext(ThemeContext);

  // Sync category from URL path
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const categoryFromPath = pathParts.length > 2 && pathParts[2] ? pathParts[2] : '';
    
    if (categoryFromPath && !filters.category) {
      setFilters(prev => ({ ...prev, category: categoryFromPath }));
    }
  }, [location.pathname]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    setSearchParams(params);
    window.dispatchEvent(new CustomEvent('filtersChanged', { detail: filters }));
  }, [filters, setSearchParams]);

  const handleResetFilters = () => {
    setFilters({
      category: '',
      city: '',
      status: '',
      urgency: '',
      sort: '-created_at'
    });
    navigate('/fundraisers');
    setTimeout(() => window.dispatchEvent(new CustomEvent('filtersCleared')), 50);
  };

  const handleSelectChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    if (field === 'category') {
      navigate(value ? `/category/${value}` : '/fundraisers');
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
          data-testid={`filter-${field}`}
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

  const activeFiltersCount = Object.entries(filters)
    .filter(([key, value]) => value && key !== 'sort')
    .length;

  return (
    <div className={`filter-container ${theme}`}>
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <i className={`icon-filter ${isExpanded ? 'icon-rotate' : ''}`}></i>
          Фільтрація
          {activeFiltersCount > 0 && <span className="filter-count"> ({activeFiltersCount})</span>}
        </h3>
      </div>

      <div className={`filter-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="filter-grid">
          <FilterSelect label="Категорія" field="category" options={categoryOptions} />
          <FilterSelect label="Місто" field="city" options={cityOptions} />
          <FilterSelect label="Статус" field="status" options={statusOptions} />
        </div>

        <div className="filter-actions">
          <button
            className={`reset-btn ${activeFiltersCount === 0 ? 'disabled' : ''}`}
            onClick={handleResetFilters}
            disabled={activeFiltersCount === 0}
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