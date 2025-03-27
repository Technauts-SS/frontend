import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import FundraisingCard from "./FundraisingCard";
import "./FundraisingList.css";

const FundraisingList = () => {
    const [searchParams] = useSearchParams();
    const [fundraisingData, setFundraisingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const helpType = searchParams.get("helpType") || "";
    const urgency = searchParams.get("urgency") || "";

    // Додавання консолей для відлагодження
    console.log("Фільтри:", { category, location, helpType, urgency });

    useEffect(() => {
        const fetchFundraisers = async () => {
            setLoading(true);
            try {
                const params = {
                    category,
                    location,
                    help_type: helpType,
                    urgency,
                };

                console.log("Запит до API з параметрами:", params); // Додано для налагодження
                const response = await axios.get("http://127.0.0.1:8000/api/fundraisers/", { params });
                
                console.log("Відповідь від API:", response.data); // Додано для налагодження
                setFundraisingData(response.data.results || response.data); // Перевірте структуру відповіді
                setLoading(false);
            } catch (err) {
                console.error("Помилка при запиті:", err); // Додано для налагодження
                setError("Не вдалося завантажити збори. Спробуйте ще раз.");
                setLoading(false);
            }
        };

        fetchFundraisers();
    }, [category, location, helpType, urgency]);

    if (loading) return <p>Завантаження зборів...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    const filteredData = fundraisingData.filter(item =>
        (!category || item.category === category) &&
        (!location || item.location === location) &&
        (!helpType || (item.donation_link ? "money" : "volunteer") === helpType) &&
        (!urgency || item.urgency === urgency)
    );

    console.log("Відфільтровані дані:", filteredData); // Додано для налагодження

    return (
        <div>
            <div className="fundraising-header">
                <h2>Збір коштів</h2>
            </div>
            <div className="fundraising-list">
                {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                        <FundraisingCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            category={item.category}
                            description={item.description}
                            image={item.image}
                            donationLink={item.donation_link}
                        />
                    ))
                ) : (
                    <p>Зборів за вибраними фільтрами немає.</p>
                )}
            </div>
        </div>
    );
};

export default FundraisingList;
