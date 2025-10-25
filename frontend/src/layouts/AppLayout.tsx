import React from 'react';
import Sidebar from '../components/navigation/Sidebar';
import Topbar from '../components/navigation/Topbar';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: string[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, breadcrumbs = [] }) => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Topbar breadcrumbs={breadcrumbs} />
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
