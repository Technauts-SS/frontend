import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useLocation } from "react-router-dom";
import FundraisingCard from "./FundraisingCard";
import "./FundraisingList.css";

const FundraisingList = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [fundraisingData, setFundraisingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ignoreFilters, setIgnoreFilters] = useState(false);

    const fetchFundraisers = async () => {
        setLoading(true);
        try {
            let params = {};
            
            // Only apply filters if we're not ignoring them
            if (!ignoreFilters) {
                const pathParts = location.pathname.split('/');
                const categoryFromPath = searchParams.get("category") ? '' 
                    : (pathParts.length > 2 && pathParts[2] ? pathParts[2] : '');
                
                if (searchParams.get("category") || categoryFromPath) {
                    params.category = searchParams.get("category") || categoryFromPath;
                }
                
                if (searchParams.get("city")) {
                    params.location = searchParams.get("city");
                }
                
                if (searchParams.get("status")) {
                    params.status = searchParams.get("status");
                }
                
                if (searchParams.get("urgency")) {
                    params.urgency = searchParams.get("urgency");
                }
            }
            
            console.log("Fetching with params:", params);
            console.log("Ignore filters:", ignoreFilters);

            // Add a timestamp to prevent caching
            params._t = new Date().getTime();
            
            const response = await axios.get("http://127.0.0.1:8000/api/fundraisers/", { params });
            
            // Filter out completed fundraisers and sort by remaining amount
            const activeFundraisers = (response.data.results || response.data)
                .filter(item => item.goal_amount > item.current_amount)
                .sort((a, b) => (a.goal_amount - a.current_amount) - (b.goal_amount - b.current_amount));
            
            setFundraisingData(activeFundraisers);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching fundraisers:", err);
            setError("Не вдалося завантажити збори. Спробуйте ще раз.");
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset ignoreFilters when URL changes
        setIgnoreFilters(false);
        fetchFundraisers();

        const handleFundraiserUpdate = () => {
            fetchFundraisers();
        };

        const handleFiltersCleared = () => {
            console.log("Filters cleared event received");
            setIgnoreFilters(true);
            fetchFundraisers();
        };

        window.addEventListener('fundraiserUpdated', handleFundraiserUpdate);
        window.addEventListener('filtersCleared', handleFiltersCleared);
        
        return () => {
            window.removeEventListener('fundraiserUpdated', handleFundraiserUpdate);
            window.removeEventListener('filtersCleared', handleFiltersCleared);
        };
    }, [searchParams, location.pathname]);

    // Extra effect to refetch when ignoreFilters changes
    useEffect(() => {
        if (ignoreFilters) {
            fetchFundraisers();
        }
    }, [ignoreFilters]);

    if (loading) return <div className="loading-message">Завантаження зборів...</div>;
    if (error) return <div className="error-message" style={{ color: "red" }}>{error}</div>;

    return (
        <div className="fundraising-container">
            <div className="fundraising-header">
                <h2>Активні збори коштів {ignoreFilters ? '(всі категорії)' : ''}</h2>
                {fundraisingData.length > 0 && (
                    <p className="fundraising-subheader"></p>
                )}
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
                    <p className="no-fundraisers-message">Наразі немає активних зборів за вибраними фільтрами.</p>
                )}
            </div>
        </div>
    );
};

export default FundraisingList;