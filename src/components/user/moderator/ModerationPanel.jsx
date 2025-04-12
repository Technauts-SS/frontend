import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './ModerationPanel.css';
import { toast } from 'react-toastify';

const ModerationPanel = () => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [reportsData, setReportsData] = useState({
    pending: [],
    recently_processed: []
  });
  const [campaignsData, setCampaignsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    campaigns: 0,
    pendingCampaigns: 0
  });

  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Завжди завантажуємо звіти
      const reportsResponse = await api.get('reports/for_moderation/');
      const reports = reportsResponse.data;

      setReportsData({
        pending: reports.pending || [],
        recently_processed: reports.recently_processed || []
      });

      setStats(prev => ({
        ...prev,
        pending: reports.pending?.length || 0,
        approved: reports.stats?.approved || reports.recently_processed?.filter(r => r.status === 'approved').length || 0,
        rejected: reports.stats?.rejected || reports.recently_processed?.filter(r => r.status === 'rejected').length || 0
      }));

      // Завжди завантажуємо кампанії (збори)
      const campaignsResponse = await api.get('fundraisers/moderation/campaigns/');
      const campaigns = campaignsResponse.data.results || campaignsResponse.data || [];
      setCampaignsData(campaigns);
      
      // Рахуємо кількість зборів зі статусом pending
      const pendingCampaigns = campaigns.filter(c => c.status === 'pending');
      
      setStats(prev => ({ 
        ...prev, 
        campaigns: campaigns.length,
        pendingCampaigns: pendingCampaigns.length 
      }));
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedTab]);

  const handleTabChange = (tabName) => {
    setSelectedTab(tabName);
    setCurrentItemId(null);
  };

  const handleAction = async (item, action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      toast.info('Будь ласка, увійдіть для виконання цієї дії');
      return;
    }
  
    try {
      setLoading(true);
  
      if (selectedTab === 'campaigns' || selectedTab === 'under_review') {
        let newStatus;
        if (action === 'approve') {
          newStatus = 'cancelled';
        } else {
          newStatus = item.previous_status || 'active';
        }
  
        const response = await api.patch(`fundraisers/${item.id}/moderate/`, {
          status: newStatus,
          resolution_note: resolutionNote
        });
  
        // Force refresh of both reports and campaigns
        await Promise.all([
          api.get('reports/for_moderation/'),
          api.get('fundraisers/moderation/campaigns/')
        ]);
      } else {
        const response = await api.patch(`reports/${item.id}/update_status/`, {
          status: action === 'approve' ? 'approved' : 'rejected',
          resolution_note: resolutionNote
        });
  
        // Explicitly refresh the campaign data if this was a report approval
        if (action === 'approve') {
          await api.get(`fundraisers/${item.fundraiser}/`);
        }
      }
  
      // Full data refresh
      await fetchAllData();
      
      toast.success(`Дія "${action === 'approve' ? 'схвалено' : 'відхилено'}" успішно виконана`);
      setResolutionNote('');
      setCurrentItemId(null);
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(`Помилка: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const viewCampaignDetails = (campaignId) => {
    navigate(`/fundraiser/${campaignId}`);
  };

  const renderCampaignCard = (campaign) => {
    const isExpanded = currentItemId === campaign.id;

    return (
      <div key={campaign.id} className={`moderation-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="card-header" onClick={() => setCurrentItemId(isExpanded ? null : campaign.id)}>
          <h3>{campaign.title}</h3>
          <span className={`badge status-badge ${campaign.status}`}>
            {campaign.status === 'pending' ? 'На розгляді' : campaign.status}
          </span>
          <div className="meta">
            <span>Створено: {new Date(campaign.created_at).toLocaleDateString('uk-UA')}</span>
            <span>Ціль: {campaign.goal_amount} грн</span>
          </div>
        </div>

        {isExpanded && (
          <div className="card-details">
            <div className="description">
              <p>{campaign.description}</p>
              {campaign.evidence && (
                <>
                  <h4>Докази:</h4>
                  <p>{campaign.evidence}</p>
                  {campaign.evidence_link && (
                    <a href={campaign.evidence_link} target="_blank" rel="noopener noreferrer">
                      Посилання на докази
                    </a>
                  )}
                </>
              )}
            </div>

            <div className="actions">
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Коментар модератора..."
                rows="3"
              />
              <div className="buttons">
                <button onClick={() => viewCampaignDetails(campaign.id)}>Переглянути збір</button>
                <button
                  className="approve"
                  onClick={() => handleAction(campaign, 'approve')}
                  disabled={loading}
                >
                  Схвалити
                </button>
                <button
                  className="reject"
                  onClick={() => handleAction(campaign, 'reject')}
                  disabled={loading}
                >
                  Відхилити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportCard = (report) => {
    const isExpanded = currentItemId === report.id;
    const isPending = report.status === 'pending';

    return (
      <div key={report.id} className={`moderation-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="card-header" onClick={() => setCurrentItemId(isExpanded ? null : report.id)}>
          <h3>Скарга #{report.id}</h3>
          <span className={`badge ${
            isPending ? 'pending' :
            report.status === 'approved' ? 'approved' : 'rejected'
          }`}>
            {isPending ? 'Очікує' :
             report.status === 'approved' ? 'Схвалено' : 'Відхилено'}
          </span>
          <div className="meta">
            <span>Дата: {new Date(report.created_at).toLocaleDateString('uk-UA')}</span>
            <span>Збір: #{report.fundraiser}</span>
            <span>Причина: {report.reason}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="card-details">
            {report.resolution_note && !isPending && (
              <div className="resolution-note">
                <h4>Коментар модератора:</h4>
                <p>{report.resolution_note}</p>
              </div>
            )}

            <div className="actions">
              {isPending ? (
                <>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Коментар модератора..."
                    rows="3"
                  />
                  <div className="buttons">
                    <button onClick={() => viewCampaignDetails(report.fundraiser)}>Переглянути збір</button>
                    <button
                      className="approve"
                      onClick={() => handleAction(report, 'approve')}
                      disabled={loading}
                    >
                      Підтверджені порушення
                    </button>
                    <button
                      className="reject"
                      onClick={() => handleAction(report, 'reject')}
                      disabled={loading}
                    >
                      Відхилені (без порушень)
                    </button>
                  </div>
                </>
              ) : (
                <div className="resolution-info">
                  <p><strong>Статус:</strong> {report.status === 'approved' ? 'Схвалено' : 'Відхилено'}</p>
                  <p><strong>Дата обробки:</strong> {new Date(report.processed_at).toLocaleDateString('uk-UA')}</p>
                  {report.resolution_note && (
                    <p><strong>Коментар:</strong> {report.resolution_note}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getActiveData = () => {
    switch (selectedTab) {
      case 'pending': 
        return reportsData.pending;
      case 'approved':
        return reportsData.recently_processed.filter(r => r.status === 'approved');
      case 'rejected':
        return reportsData.recently_processed.filter(r => r.status === 'rejected');
      case 'campaigns':
        return campaignsData; // Тут повертаються всі збори
      case 'under_review': 
        // Фільтруємо збори зі статусом 'pending' для вкладки 'under_review'
        return campaignsData.filter(campaign => campaign.status === 'pending');
      default: 
        return [];
    }
  };
  

  return (
    <div className="moderation-panel">
      <h1>Панель модератора</h1>

      <div className="tabs">
        <button
          className={selectedTab === 'pending' ? 'active' : ''}
          onClick={() => handleTabChange('pending')}
        >
          Скарги на модерації <span>{stats.pending}</span>
        </button>
        <button
          className={selectedTab === 'approved' ? 'active' : ''}
          onClick={() => handleTabChange('approved')}
        >
          Підтверджені скарги <span>{stats.approved}</span>
        </button>
        <button
          className={selectedTab === 'rejected' ? 'active' : ''}
          onClick={() => handleTabChange('rejected')}
        >
          Без порушень <span>{stats.rejected}</span>
        </button>
        <button
          className={selectedTab === 'under_review' ? 'active' : ''}
          onClick={() => handleTabChange('under_review')}
        >
          Збори на розгляді <span>{stats.pendingCampaigns}</span>
        </button>
      </div>

      {loading && <div className="loading">Завантаження...</div>}
      {error && <div className="error">{error}</div>}

      <div className="content">
        {getActiveData().length > 0 ? (
          selectedTab === 'pending' || selectedTab === 'approved' || selectedTab === 'rejected'
            ? getActiveData().map(renderReportCard)
            : getActiveData().map(renderCampaignCard)
        ) : (
          <div className="empty">Немає елементів для перегляду</div>
        )}
      </div>
    </div>
  );
};

export default ModerationPanel;