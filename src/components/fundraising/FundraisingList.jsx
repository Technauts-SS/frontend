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

    const fetchFundraisers = async () => {
        setLoading(true);
        try {
            const params = {
                category: searchParams.get("category") || "",
                location: searchParams.get("location") || "",
                help_type: searchParams.get("helpType") || "",
                urgency: searchParams.get("urgency") || ""
            };

            const response = await axios.get("http://127.0.0.1:8000/api/fundraisers/", { params });
            setFundraisingData(response.data.results || response.data);
            setLoading(false);
        } catch (err) {
            setError("Не вдалося завантажити збори. Спробуйте ще раз.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFundraisers();

        const handleFundraiserUpdate = () => {
            fetchFundraisers(); // Оновлюємо список при змінах
        };

        window.addEventListener('fundraiserUpdated', handleFundraiserUpdate);
        return () => {
            window.removeEventListener('fundraiserUpdated', handleFundraiserUpdate);
        };
    }, [searchParams]);

    if (loading) return <p>Завантаження зборів...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <div className="fundraising-header">
                <h2>Збір коштів</h2>
            </div>
            <div className="fundraising-list">
                {fundraisingData.length > 0 ? (
                    fundraisingData.map((item) => (
                        <FundraisingCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            category={item.category}
                            description={item.description}
                            image={item.image}
                            donationLink={item.donation_link}
                            currentAmount={item.current_amount}
                            goalAmount={item.goal_amount}
                            status={item.status}
                            createdAt={item.created_at}
                            creator={item.creator}
                            location={item.location}
                            urgency={item.urgency}
                            showFullInfo={true}
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