import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Team.module.css';

const Team: React.FC = () => {
  const members = [
    { name: 'Анна Кузнецова', role: 'Менеджер', status: 'Активен' },
    { name: 'Олег Пастухов', role: 'Менеджер', status: 'В отпуске' },
    { name: 'Екатерина Иванова', role: 'Администратор', status: 'Активен' },
  ];

  return (
    <AppLayout breadcrumbs={['Команда']}>
      <div className={styles.team}>
        <div className={styles.header}>
          <h1>Команда и роли</h1>
          <button className={styles.addButton}>+ Пригласить участника</button>
        </div>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь будет управление участниками, ролями и доступами.</p>
        </div>

        <div className={styles.preview}>
          <h2>Пример членов команды</h2>
          <div className={styles.grid}>
            {members.map((member) => (
              <div key={member.name} className={styles.card}>
                <div className={styles.initials}>{member.name[0]}</div>
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                  <span className={`${styles.badge} ${member.status === 'Активен' ? styles.active : styles.inactive}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Team;
