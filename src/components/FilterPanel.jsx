import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";
import "../components/FilterPanel.css";

const FilterPanel = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [location, setLocation] = useState(searchParams.get("location") || "");
    const [helpType, setHelpType] = useState(searchParams.get("helpType") || "");
    const [urgency, setUrgency] = useState(searchParams.get("urgency") || "");
    
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (location) params.set("location", location);
        if (helpType) params.set("helpType", helpType);
        if (urgency) params.set("urgency", urgency);

        setSearchParams(params);
    }, [category, location, helpType, urgency, setSearchParams]);

    const handleResetFilters = () => {
        setCategory("");
        setLocation("");
        setHelpType("");
        setUrgency("");
    };

    return (
        <div className={`filter-panel ${theme}`}>
            <h3>Фільтри</h3>
            <div className="filter-group">
                <label>Категорія:</label>
                <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Всі категорії</option>
                    <option value="health">Здоров'я</option>
                    <option value="social">Соціальна допомога</option>
                    <option value="education">Освіта та наука</option>
                    <option value="ecology">Екологія та тварини</option>
                    <option value="other">Інше</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Локація:</label>
                <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Всі локації</option>
                    <option value="kyiv">Київ</option>
                    <option value="lviv">Львів</option>
                    <option value="kharkiv">Харків</option>
                    <option value="odesa">Одеса</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Тип допомоги:</label>
                <select 
                    value={helpType} 
                    onChange={(e) => setHelpType(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Всі типи допомоги</option>
                    <option value="money">Фінансова допомога</option>
                    <option value="volunteer">Волонтерська допомога</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Терміновість:</label>
                <select 
                    value={urgency} 
                    onChange={(e) => setUrgency(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Будь-яка терміновість</option>
                    <option value="urgent">Терміново</option>
                    <option value="non-urgent">Не терміново</option>
                </select>
            </div>

            <button 
                onClick={handleResetFilters} 
                className="reset-button"
            >
                Скинути фільтри
            </button>
        </div>
    );
};

export default FilterPanel;