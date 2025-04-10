import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchUsers = useCallback(async (forceUpdate = false) => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        ...(forceUpdate && { timestamp: Date.now() })
      };

      const response = await api.get('/users/', { params });
      
      setUsers(response.data.results || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.count || 0
      }));
      setError(null);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Не вдалося завантажити користувачів');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      
      const interval = setInterval(() => {
        fetchUsers(true);
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [user, pagination.page, pagination.pageSize, fetchUsers]);

  const updateUserRole = async (userId, newRole) => {
    try {
      setLoading(true);
      
      // Оптимістичне оновлення
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      const { data } = await api.post(`/users/${userId}/make_${newRole}/`);
      console.log('Role update response:', data);

      // Оновлюємо тільки зміненого користувача
      if (data.user) {
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId ? { ...u, ...data.user } : u
          )
        );
      } else {
        await fetchUsers(true);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      await fetchUsers(true);
      alert(`Помилка: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (e) => {
    setPagination(prev => ({
      ...prev,
      pageSize: Number(e.target.value),
      page: 1
    }));
  };

  const renderRoleBadge = (role) => {
    const roleMap = {
      admin: { text: 'Адміністратор', class: 'admin' },
      moderator: { text: 'Модератор', class: 'moderator' },
      user: { text: 'Користувач', class: 'user' }
    };
    
    const current = roleMap[role] || { text: role, class: '' };
    
    return (
      <span className={`role-badge ${current.class}`}>
        {current.text}
      </span>
    );
  };

  if (user?.role !== 'admin') {
    return <div className="access-denied">Доступ заборонено. Тільки для адміністраторів.</div>;
  }

  return (
    <div className="admin-panel">
      <h2>Панель адміністратора</h2>
      <div className="last-update">
        Останнє оновлення: {new Date(lastUpdate).toLocaleTimeString()}
        <button 
          onClick={() => fetchUsers(true)}
          disabled={loading}
          className="refresh-button"
        >
          {loading ? 'Оновлення...' : 'Оновити дані'}
        </button>
      </div>
      
      {loading && users.length === 0 ? (
        <div className="loading">Завантаження...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : users.length === 0 ? (
        <div className="no-users">Користувачі не знайдені</div>
      ) : (
        <>
          <div className="pagination-controls">
            <div className="page-size-selector">
              <label htmlFor="pageSize">Кількість на сторінці:</label>
              <select
                id="pageSize"
                value={pagination.pageSize}
                onChange={handlePageSizeChange}
                disabled={loading}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            
            <div className="page-navigation">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                Попередня
              </button>
              
              <span>
                Сторінка {pagination.page} з {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total || loading}
              >
                Наступна
              </button>
            </div>
          </div>
          
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ім'я</th>
                <th>Email</th>
                <th>Поточна роль</th>
                <th>Змінити роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map(userItem => (
                <tr key={userItem.id}>
                  <td>{userItem.id}</td>
                  <td>{userItem.full_name}</td>
                  <td>{userItem.email}</td>
                  <td>
                    {renderRoleBadge(userItem.role)}
                  </td>
                  <td>
                    <select
                      value={userItem.role}
                      onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                      disabled={userItem.id === user?.id || loading}
                      className="role-select"
                    >
                      <option value="user">Користувач</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Адміністратор</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination-info">
            <span>Всього користувачів: {pagination.total}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;