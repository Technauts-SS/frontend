import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import "./FundraiserDetail.css";

const FundraiserDetail = () => {
    const { id } = useParams();
    const [fundraiser, setFundraiser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`http://127.0.0.1:8000/api/fundraisers/${id}/`)
            .then(response => {
                setFundraiser(response.data);
            })
            .catch(error => {
                setError('Не вдалося завантажити збір.');
                console.error(error);
            });
    }, [id]);

    if (error) {
        return <p className="error">{error}</p>;
    }

    if (!fundraiser) {
        return <p>Завантаження...</p>;
    }

    return (
        <div className="fundraiser-detail">
            <img src={fundraiser.image || 'default-image.jpg'} alt={fundraiser.title} className="fundraiser-image"/>
            <h2>{fundraiser.title}</h2>
            <p><strong>Ім'я організатора:</strong> {fundraiser.creator_name}</p>
            <p><strong>Контакт:</strong> {fundraiser.contact_info}</p>
            <p>{fundraiser.description}</p>
            <p><strong>Ціль:</strong> {fundraiser.goal_amount} грн</p>
            {fundraiser.donation_link && (
                <p>
                    <a href={fundraiser.donation_link} target="_blank" rel="noopener noreferrer">
                        Підтримати збір
                    </a>
                </p>
            )}
        </div>
    );
};

export default FundraiserDetail;
