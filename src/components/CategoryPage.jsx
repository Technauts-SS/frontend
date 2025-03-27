import { useSearchParams } from "react-router-dom";
import FundraisingList from "./fundraising/FundraisingList";
import FilterPanel from "../components/FilterPanel";
import "../components/CategoryPage.css";
import helpImage from "../assets/images/help.png"; // Імпорт зображення

const categoryMappings = {
  health: "Здоров'я",
  social: "Соціальна допомога",
  education: "Освіта та наука",
  ecology: "Екологія та тварини",
};

const CategoryPage = () => {
    const [searchParams] = useSearchParams();

    // Отримуємо значення з URL
    const categoryKey = searchParams.get("category") || "";
    const category = categoryMappings[categoryKey] || categoryKey; // Конвертуємо в правильну назву

    const location = searchParams.get("location") || "";
    const helpType = searchParams.get("helpType") || "";
    const urgency = searchParams.get("urgency") || "";

    console.log("URL параметри:", { category, location, helpType, urgency });

    return (
        <div>
            

            <FilterPanel />
            <FundraisingList 
                category={category} 
                location={location} 
                helpType={helpType} 
                urgency={urgency} 
            />
        </div>
    );
};

export default CategoryPage;
