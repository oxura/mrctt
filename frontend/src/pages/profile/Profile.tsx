import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import styles from './Profile.module.css';

const Profile: React.FC = () => {
  const { user, setAuth, tenant } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    googleCalendarLink: user?.google_calendar_link || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put('/users/profile', formData);
      if (response.data.status === 'success') {
        if (tenant && user) {
          setAuth({
            user: { ...user, ...response.data.data.user },
            tenant: tenant,
            csrfToken: null
          });
        }
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={['Профиль']}>
      <div className={styles.profile}>
        <h1>Мой профиль</h1>
        <div className={styles.card}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
               {formData.firstName?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
            </div>
            <div>
              <h2>{formData.firstName || 'Пользователь'} {formData.lastName}</h2>
              <p>{user?.email}</p>
              <p className={styles.role}>{user?.role}</p>
            </div>
             {!isEditing && (
                <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                  Редактировать
                </button>
             )}
          </div>

          {isEditing ? (
             <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                   <label>Имя</label>
                   <input 
                     name="firstName"
                     value={formData.firstName}
                     onChange={handleChange}
                     placeholder="Имя"
                   />
                </div>
                <div className={styles.formGroup}>
                   <label>Фамилия</label>
                   <input 
                     name="lastName"
                     value={formData.lastName}
                     onChange={handleChange}
                     placeholder="Фамилия"
                   />
                </div>
                <div className={styles.formGroup}>
                   <label>Публичная ссылка Google Calendar (iCal)</label>
                   <input 
                     name="googleCalendarLink"
                     value={formData.googleCalendarLink}
                     onChange={handleChange}
                     placeholder="https://calendar.google.com/calendar/ical/..."
                   />
                   <small>
                      Инструкция: <br/>
                      1. Откройте Google Calendar.<br/>
                      2. Настройки -&gt; Настройки моих календарей.<br/>
                      3. Выберите нужный календарь.<br/>
                      4. "Разрешения на доступ": Поставьте галочку "Открыть общий доступ".<br/>
                      5. Прокрутите вниз до "Интеграция календаря".<br/>
                      6. Скопируйте "Общедоступный адрес в формате iCal".
                   </small>
                </div>
                
                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                   <button type="button" onClick={() => setIsEditing(false)} disabled={isLoading}>Отмена</button>
                   <button type="submit" disabled={isLoading}>Сохранить</button>
                </div>
             </form>
          ) : (
             <div className={styles.details}>
                <p><strong>Google Calendar:</strong> {user?.google_calendar_link || 'Не настроен'}</p>
             </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
