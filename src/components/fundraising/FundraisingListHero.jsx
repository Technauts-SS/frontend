import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams, useLocation } from "react-router-dom";
import FundraisingCard from "./FundraisingCard";
import "./FundraisingListHero.css";

// Custom arrow components instead of lucide-react
const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const FundraisingList = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [fundraisingData, setFundraisingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ignoreFilters, setIgnoreFilters] = useState(false);
    const sliderRef = useRef(null);
    
    // For navigation
    const scrollLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: -340, behavior: 'smooth' });
        }
    };
    
    const scrollRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
    };

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
            const allFundraisers = response.data.results || response.data;
            
            // Filter out completed fundraisers (where goal_amount <= current_amount)
            const activeFundraisers = allFundraisers.filter(
                item => item.goal_amount > item.current_amount
            );
            
            // Sort fundraisers by the amount left to collect (least remaining first)
            const sortedFundraisers = activeFundraisers.map(item => ({
                ...item,
                amountLeft: item.goal_amount - item.current_amount
            }))
            .sort((a, b) => a.amountLeft - b.amountLeft)
            .slice(0, 6); // Take only the top 6
            
            setFundraisingData(sortedFundraisers);
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
        <div className="fundraising-container">
            <div className="fundraising-header">
                <h2>Збір коштів {ignoreFilters ? '(всі категорії)' : ''}</h2>
                <p className="fundraising-subheader">Залишилось найменше зібрати</p>
            </div>
            
            <div className="fundraising-slider-container">
                <button 
                    className="slider-nav-button slider-nav-left" 
                    onClick={scrollLeft}
                    aria-label="Гортати ліворуч"
                >
                    <ChevronLeft />
                </button>
                
                <div className="fundraising-slider" ref={sliderRef}>
                    {fundraisingData.length > 0 ? (
                        fundraisingData.map((item) => (
                            <div className="fundraising-slide" key={item.id}>
                                <FundraisingCard
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
                            </div>
                        ))
                    ) : (
                        <p className="no-fundraisers">Наразі немає активних зборів за вибраними фільтрами.</p>
                    )}
                </div>
                
                <button 
                    className="slider-nav-button slider-nav-right" 
                    onClick={scrollRight}
                    aria-label="Гортати праворуч"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
};

export default FundraisingList;