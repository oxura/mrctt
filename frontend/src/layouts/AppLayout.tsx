import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Topbar from '../components/navigation/Topbar';
import { getBreadcrumbs } from '../utils/breadcrumbs';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: string[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, breadcrumbs }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const finalBreadcrumbs = breadcrumbs || getBreadcrumbs(location.pathname);

  return (
    <div className={styles.container}>
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className={styles.contentArea}>
        <Topbar breadcrumbs={finalBreadcrumbs} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
