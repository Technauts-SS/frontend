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
                
                if (searchParams.get("location")) {
                    params.location = searchParams.get("location");
                }
                
                if (searchParams.get("helpType")) {
                    params.help_type = searchParams.get("helpType");
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
            setFundraisingData(response.data.results || response.data);
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

    if (loading) return <p>Завантаження зборів...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <div className="fundraising-header">
                <h2>Збір коштів {ignoreFilters ? '(всі категорії)' : ''}</h2>
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