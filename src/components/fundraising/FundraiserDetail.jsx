import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DonationForm from './DonationForm';
import "./FundraiserDetail.css";
import api from '../../api';

const FundraiserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fundraiser, setFundraiser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [donations, setDonations] = useState([]);
    const [donationsLoading, setDonationsLoading] = useState(false);
    const [animatedAmount, setAnimatedAmount] = useState(0);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [reportError, setReportError] = useState(null);
    const [canReport, setCanReport] = useState(true);
    const [nextReportTime, setNextReportTime] = useState(null);
    const [reportsCount, setReportsCount] = useState(0);

    const REPORT_REASONS = [
        "Недостовірна інформація",
        "Порушення правил платформи",
        "Шахрайство",
        "Інше"
    ];

    const getDefaultImage = (category) => {
        const categoryMap = {
            health: '/images/defaults/health.png',
            social: '/images/defaults/social.png',
            education: '/images/defaults/education.png',
            ecology: '/images/defaults/ecology.png',
            other: '/images/defaults/other.png'
        };
        return categoryMap[category] || '/images/defaults/other.png';
    };

    const getImageUrl = () => {
        try {
            if (imageError || !fundraiser?.image) return getDefaultImage(fundraiser?.category);
            if (fundraiser.image.startsWith('http')) return fundraiser.image;
            if (fundraiser.image.startsWith('/media/')) {
                return `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${fundraiser.image}`;
            }
            return fundraiser.image;
        } catch (error) {
            return getDefaultImage('other');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('uk-UA', options);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString('uk-UA', options);
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', { 
            style: 'currency', 
            currency: 'UAH',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getCategoryLabel = (category) => {
        const categories = {
            health: "Здоров'я",
            social: "Соціальна допомога",
            education: "Освіта та наука",
            ecology: "Екологія та тварини",
            other: "Інше"
        };
        return categories[category] || category;
    };

    const getStatusLabel = (status) => {
        const statuses = {
            pending: "На розгляді",
            active: "Активний",
            paused: "Призупинений",
            completed: "Завершений",
            cancelled: "Скасований"
        };
        return statuses[status] || status;
    };

    const checkReportAvailability = async () => {
        if (!localStorage.getItem('token')) return;
        
        try {
            const response = await api.get(`/reports/check/?fundraiser=${id}`);
            if (response.data.exists) {
                setCanReport(false);
                setNextReportTime(new Date(response.data.next_available));
            } else {
                setCanReport(true);
                setNextReportTime(null);
            }
        } catch (error) {
            console.error('Error checking report availability:', error);
            setCanReport(true);
        }
    };

    const checkReportsThreshold = async () => {
        try {
            const response = await api.get(`/reports/count/?fundraiser=${id}`);
            setReportsCount(response.data.count);
            
            if (response.data.count >= 3 && fundraiser?.status === 'active') {
                await api.patch(`/fundraisers/${id}/moderate/`, {
                    status: 'paused',
                    resolution_note: 'Автоматичне призупинення через кількість скарг'
                });
                toast.warning('Збір призупинено через кількість скарг');
                fetchFundraiserData();
            }
        } catch (error) {
            console.error('Error checking reports threshold:', error);
        }
    };

    const fetchDonations = async () => {
        setDonationsLoading(true);
        try {
            const donationsRes = await api.get(`/fundraisers/${id}/donations/`);
            const donationsData = donationsRes.data || [];
            setDonations(Array.isArray(donationsData) ? donationsData : []);
        } catch (error) {
            console.error('Error fetching donations:', error);
            toast.error('Не вдалося завантажити список донатів');
            setDonations([]);
        } finally {
            setDonationsLoading(false);
        }
    };

    const fetchFundraiserData = async () => {
        try {
            setLoading(true);
            setFetchError(null);

            const fundraiserRes = await api.get(`/fundraisers/${id}/`);
            
            if (!fundraiserRes.data) {
                throw new Error('Збір не знайдено');
            }

            setFundraiser(fundraiserRes.data);
            
            if (localStorage.getItem('token')) {
                await fetchDonations();
            }

            animateValue(0, fundraiserRes.data.current_amount, setAnimatedAmount);
            const newProgress = fundraiserRes.data.goal_amount > 0 ? 
                Math.min(100, (fundraiserRes.data.current_amount / fundraiserRes.data.goal_amount) * 100) : 0;
            animateValue(0, newProgress, setAnimatedProgress);
            
            const userId = localStorage.getItem('userId');
            setIsOwner(userId && userId === fundraiserRes.data.creator?.id?.toString());

            await checkReportsThreshold();
        } catch (error) {
            console.error('Error fetching fundraiser data:', error);
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.message || 
                               error.message ||
                               'Не вдалося завантажити дані збору';
            setFetchError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const animateValue = (start, end, setValue) => {
        if (start === end) return;
        
        const duration = 500;
        const startTime = performance.now();
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const fraction = Math.min(elapsed / duration, 1);
            
            setValue(Math.round(start + (end - start) * fraction));
            
            if (fraction < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    };

    const handleReportSubmit = async () => {
        if (!reportReason) {
            toast.error('Будь ласка, оберіть причину скарги');
            return;
        }
    
        try {
            setIsReporting(true);
            setReportError(null);
            
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                toast.info('Будь ласка, увійдіть для відправки скарги');
                return;
            }
    
            const response = await api.post('/reports/', {
                fundraiser: parseInt(id),
                reason: reportReason
            });
            
            toast.success('Скаргу успішно надіслано!');
            setShowReportModal(false);
            setReportReason('');
            
            await checkReportsThreshold();
            setCanReport(false);
            const nextTime = new Date();
            nextTime.setHours(nextTime.getHours() + 24);
            setNextReportTime(nextTime);
        } catch (error) {
            console.error('Помилка при відправці:', error);
            
            let errorMessage = 'Не вдалося надіслати скаргу';
            
            if (error.response?.data) {
                if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data.non_field_errors) {
                    errorMessage = error.response.data.non_field_errors.join(', ');
                } else if (error.response.data.next_available_time) {
                    errorMessage = `Ви вже створили скаргу. Наступна скарга можлива після ${formatDateTime(new Date(error.response.data.next_available_time))}`;
                    setNextReportTime(new Date(error.response.data.next_available_time));
                    setCanReport(false);
                }
            }
    
            toast.error(errorMessage, {
                autoClose: 5000,
                closeButton: true,
            });
        } finally {
            setIsReporting(false);
        }
    };

    useEffect(() => {
        fetchFundraiserData();
        checkReportAvailability();
        
        const handleFundraiserUpdate = (e) => {
            if (e.detail.id === id) {
                setFundraiser(prev => ({
                    ...prev,
                    current_amount: e.detail.currentAmount
                }));
                animateValue(animatedAmount, e.detail.currentAmount, setAnimatedAmount);
                animateValue(animatedProgress, e.detail.progress, setAnimatedProgress);
            }
        };

        window.addEventListener('fundraiserUpdated', handleFundraiserUpdate);
        return () => {
            window.removeEventListener('fundraiserUpdated', handleFundraiserUpdate);
        };
    }, [id]);

    const handleDonationSubmit = async (donationData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                toast.info('Будь ласка, увійдіть для здійснення донату');
                return;
            }
    
            const response = await api.post('/donations/', { 
                ...donationData, 
                campaign: id 
            });
            
            toast.success('Донат успішно здійснено!');
            setShowDonationForm(false);
            
            await fetchFundraiserData();
            await fetchDonations();
            
        } catch (error) {
            console.error('Error submitting donation:', error);
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.message || 
                               'Помилка при здійсненні донату';
            toast.error(errorMessage);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Ви впевнені, що хочете видалити цей збір?")) {
            try {
                await api.delete(`/fundraisers/${id}/`);
                toast.success('Збір успішно видалено');
                navigate('/');
            } catch (error) {
                console.error('Error deleting fundraiser:', error);
                const errorMessage = error.response?.data?.detail || 
                                   'Не вдалося видалити збір. Спробуйте пізніше';
                toast.error(errorMessage);
            }
        }
    };

    const renderStatusBadge = () => {
        if (!fundraiser) return null;
        
        const statusClass = `status-badge ${fundraiser.status}`;
        return (
            <div className={statusClass}>
                {getStatusLabel(fundraiser.status)}
            </div>
        );
    };

    const renderCompletionDetails = () => {
        if (fundraiser?.status !== 'completed') return null;

        return (
            <div className="completion-section">
                <h2>Збір завершено</h2>
                <div className="completion-details">
                    <p>
                        <strong>Дата завершення:</strong> {formatDate(fundraiser.ends_at)}
                    </p>
                    <p>
                        <strong>Результат:</strong> Зібрано {formatAmount(fundraiser.current_amount)} з цільових {formatAmount(fundraiser.goal_amount)} (
                        {Math.round((fundraiser.current_amount / fundraiser.goal_amount) * 100)}%)
                    </p>
                </div>
            </div>
        );
    };

    const renderDonationsList = () => {
        if (!Array.isArray(donations)) {
            console.error('Donations is not an array:', donations);
            return <p className="no-donations">Помилка завантаження донатів</p>;
        }

        if (donationsLoading) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner small"></div>
                    <p>Завантаження донатів...</p>
                </div>
            );
        }

        if (donations.length === 0) {
            return <p className="no-donations">Ще немає донатів. Будьте першим!</p>;
        }

        const displayedDonations = donations.slice(0, 5);

        return (
            <ul className="donations-list">
                {displayedDonations.map(donation => {
                    if (!donation || typeof donation !== 'object') {
                        return null;
                    }
                    
                    return (
                        <li key={donation.id || Math.random()} className="donation-item">
                            <div className="donation-amount">
                                {formatAmount(donation.amount || 0)}
                            </div>
                            <div className={`donation-status status-${donation.status || 'pending'}`}>
                                {donation.status === 'success' ? '✓ Успішно' : 
                                 donation.status === 'pending' ? '⏳ В очікуванні' : '✗ Не вдалося'}
                            </div>
                            <div className="donation-date">
                                {formatDate(donation.created_at)}
                            </div>
                            {donation.user && (
                                <div className="donation-user">
                                    {donation.user.full_name || donation.user.username || 'Анонім'}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Завантаження даних збору...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="error-container">
                <p className="error-message">{fetchError}</p>
                {fetchError.includes('увійти') ? (
                    <button 
                        onClick={() => navigate('/login')}
                        className="login-button"
                    >
                        Увійти
                    </button>
                ) : (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="retry-button"
                    >
                        Спробувати знову
                    </button>
                )}
                <Link to="/" className="back-button">
                    На головну
                </Link>
            </div>
        );
    }

    if (!fundraiser) {
        return (
            <div className="error-container">
                <p className="error-message">Збір не знайдено</p>
                <Link to="/" className="back-button">
                    На головну
                </Link>
            </div>
        );
    }

    return (
        <div className="fundraiser-detail">
            <div className="fundraiser-header">
                <div className="image-container">
                    <img 
                        src={getImageUrl()}
                        alt={fundraiser.title}
                        className={`fundraiser-image ${imageError || !fundraiser.image ? 'fallback' : ''}`}
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                    <div className="category-badge">
                        {getCategoryLabel(fundraiser.category)}
                    </div>
                    {reportsCount > 0 && (
                        <div className="reports-badge" title={`Кількість скарг: ${reportsCount}`}>
                            ⚠️ {reportsCount}
                        </div>
                    )}
                    {renderStatusBadge()}
                </div>

                <div className="fundraiser-meta">
                    <div className="title-section">
                        <h1>{fundraiser.title}</h1>
                        <div className="owner-actions">
                            {isOwner ? (
                                <>
                                    <Link 
                                        to={`/fundraiser/${id}/edit`}
                                        className="edit-button"
                                    >
                                        Редагувати
                                    </Link>
                                    <button 
                                        onClick={handleDelete}
                                        className="delete-button"
                                    >
                                        Видалити
                                    </button>
                                </>
                            ) : (
                                localStorage.getItem('token') && (
                                    canReport ? (
                                        <button 
                                            onClick={() => setShowReportModal(true)}
                                            className="report-button"
                                        >
                                            Поскаржитися
                                        </button>
                                    ) : (
                                        <button 
                                            className="report-button disabled"
                                            disabled
                                            title={`Ви вже створили скаргу. Наступна скарга можлива ${nextReportTime ? `після ${formatDateTime(nextReportTime)}` : 'через 24 години'}`}
                                        >
                                            Поскаржитися
                                        </button>
                                    )
                                )
                            )}
                        </div>
                    </div>

                    <div className="fundraiser-creator">
                        <span className="meta-label">Організатор:</span>
                        <span>{fundraiser.creator_name || fundraiser.creator?.full_name || 'Невідомий організатор'}</span>
                    </div>

                    <div className="fundraiser-date">
                        <span className="meta-label">Дата створення:</span>
                        <span>{formatDate(fundraiser.created_at)}</span>
                    </div>

                    {fundraiser.ends_at && (
                        <div className="fundraiser-date">
                            <span className="meta-label">Дата завершення:</span>
                            <span>{formatDate(fundraiser.ends_at)}</span>
                        </div>
                    )}

                    <div className="fundraiser-progress">
                        <div className="progress-container">
                            <div 
                                className="progress-bar" 
                                style={{ 
                                    width: `${animatedProgress}%`,
                                    backgroundColor: animatedProgress >= 100 ? '#4CAF50' : '#2196F3',
                                    transition: 'width 0.5s ease, background-color 0.3s ease'
                                }}
                            ></div>
                            <span className="progress-percentage">
                                {Math.round(animatedProgress)}%
                            </span>
                        </div>

                        <div className="amounts-display">
                            <div className="amount-item">
                                <span className="amount-label">Зібрано:</span>
                                <span className="amount-value collected">
                                    {formatAmount(animatedAmount)}
                                </span>
                            </div>
                            <div className="amount-item">
                                <span className="amount-label">Ціль:</span>
                                <span className="amount-value goal">
                                    {formatAmount(fundraiser.goal_amount)}
                                </span>
                            </div>
                            {animatedProgress < 100 && (
                                <div className="amount-item">
                                    <span className="amount-label">Залишилось:</span>
                                    <span className="amount-value remaining">
                                        {formatAmount(fundraiser.goal_amount - animatedAmount)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fundraiser-content">
                <div className="fundraiser-description">
                    <h2>Про збір</h2>
                    <p>{fundraiser.description}</p>
                </div>

                {fundraiser.evidence && (
                    <div className="fundraiser-evidence">
                        <h2>Підтвердження</h2>
                        <p>{fundraiser.evidence}</p>
                        {fundraiser.evidence_link && (
                            <a 
                                href={fundraiser.evidence_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="evidence-link"
                            >
                                Посилання на докази
                            </a>
                        )}
                    </div>
                )}

                {renderCompletionDetails()}

                <div className="donation-section">
                    <h2>Підтримати збір</h2>
                    
                    {fundraiser.status === 'active' ? (
                        <>
                            {!showDonationForm ? (
                                <button 
                                    onClick={() => {
                                        if (!localStorage.getItem('token')) {
                                            navigate('/login');
                                            toast.info('Будь ласка, увійдіть для здійснення донату');
                                        } else {
                                            setShowDonationForm(true);
                                        }
                                    }}
                                    className="donate-button"
                                >
                                    Зробити внесок
                                </button>
                            ) : (
                                <DonationForm 
                                    onSubmit={handleDonationSubmit}
                                    onCancel={() => setShowDonationForm(false)}
                                    campaignId={id}
                                />
                            )}

                            <div className="donations-container">
                                <h3>Останні донати</h3>
                                {renderDonationsList()}
                                {donations.length > 5 && (
                                    <button 
                                        className="show-more"
                                        onClick={() => navigate(`/fundraiser/${id}/donations`)}
                                    >
                                        Показати всі донати
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="campaign-not-active">
                            Цей збір {fundraiser.status === 'completed' ? 'вже завершено' : 
                                     fundraiser.status === 'paused' ? 'тимчасово призупинено' : 
                                     'не активний'}. Донати не приймаються.
                        </p>
                    )}
                </div>

                <div className="action-buttons">
                    <Link to="/" className="back-button">
                        Назад до всіх зборів
                    </Link>
                </div>
            </div>

            {showReportModal && (
                <div className="modal-overlay">
                    <div className="report-modal">
                        <h3>Поскаржитися на збір</h3>
                        <p>Оберіть причину:</p>
                        
                        <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            disabled={isReporting}
                            className="report-select"
                        >
                            <option value="">-- Оберіть причину --</option>
                            {REPORT_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>

                        {reportError && (
                            <div className="report-error">
                                <p>{reportError.response?.data?.detail || 
                                    reportError.message || 
                                    'Сталася помилка при відправці скарги'}</p>
                                {reportError.response?.data?.created_at && (
                                    <p>Час останньої скарги: {formatDateTime(reportError.response.data.created_at)}</p>
                                )}
                                {reportError.response?.data?.next_available_time && (
                                    <p>Наступна можлива скарга: {formatDateTime(reportError.response.data.next_available_time)}</p>
                                )}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                onClick={handleReportSubmit}
                                disabled={!reportReason || isReporting}
                                className="submit-button"
                            >
                                {isReporting ? 'Надсилання...' : 'Надіслати'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportError(null);
                                }}
                                disabled={isReporting}
                                className="cancel-button"
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FundraiserDetail;