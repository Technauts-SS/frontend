import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api';

const ModerationPanel = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      const fetchCampaigns = async () => {
        try {
          const response = await api.get('/campaigns/moderation_list/');
          setCampaigns(response.data);
        } catch (error) {
          console.error('Failed to fetch campaigns:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCampaigns();
    }
  }, [user]);

  const handleModeration = async (campaignId, action) => {
    try {
      if (action === 'approve') {
        await api.post(`/campaigns/${campaignId}/approve/`);
      } else {
        await api.post(`/campaigns/${campaignId}/reject/`);
      }
      // Оновити список
      const response = await api.get('/campaigns/moderation_list/');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Moderation failed:', error);
    }
  };

  if (!(user?.role === 'moderator' || user?.role === 'admin')) {
    return <div>Доступ заборонено. Тільки для модераторів та адміністраторів.</div>;
  }

  return (
    <div className="moderation-panel">
      <h2>Панель модератора</h2>
      {loading ? (
        <p>Завантаження...</p>
      ) : (
        <div className="campaigns-list">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="campaign-item">
              <h3>{campaign.title}</h3>
              <p>{campaign.description}</p>
              <div className="moderation-actions">
                <button onClick={() => handleModeration(campaign.id, 'approve')}>
                  Схвалити
                </button>
                <button onClick={() => handleModeration(campaign.id, 'reject')}>
                  Відхилити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationPanel;