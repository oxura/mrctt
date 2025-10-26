import React, { useState } from 'react';
import Sidebar from '../components/navigation/Sidebar';
import Topbar from '../components/navigation/Topbar';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: string[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, breadcrumbs = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className={styles.contentArea}>
        <Topbar breadcrumbs={breadcrumbs} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
