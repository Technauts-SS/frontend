import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchUsers = async () => {
        try {
          const response = await api.get('/users/');
          setUsers(response.data);
        } catch (error) {
          console.error('Failed to fetch users:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [user]);

  const updateUserRole = async (userId, newRole) => {
    try {
      if (newRole === 'admin') {
        await api.post(`/users/${userId}/make_admin/`);
      } else if (newRole === 'moderator') {
        await api.post(`/users/${userId}/make_moderator/`);
      }
      // Оновити список
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (user?.role !== 'admin') {
    return <div>Доступ заборонено. Тільки для адміністраторів.</div>;
  }

  return (
    <div className="admin-panel">
      <h2>Панель адміністратора</h2>
      {loading ? (
        <p>Завантаження...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ім'я</th>
              <th>Email</th>
              <th>Поточна роль</th>
              <th>Змінити роль</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={user.role === 'admin'} // Не можна змінити роль іншого адміна
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
      )}
    </div>
  );
};

export default AdminPanel;