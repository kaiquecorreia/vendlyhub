'use client';

import Link from 'next/link';
import styles from './topbar.module.scss';
import { Building2, ExternalLink, LogOut, User } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { resolveMediaUrl } from '@/app/services/mediaUrl';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const avatarUrl = useMemo(() => resolveMediaUrl(user?.avatar ?? null) ?? null, [user?.avatar]);

  const userInitial = useMemo(() => {
    const name = user?.name?.trim();
    if (name) {
      const firstPart = name.split(/\s+/)[0];
      if (firstPart.length > 0) {
        return firstPart[0]!.toUpperCase();
      }
    }
    const email = user?.email?.trim();
    if (email) {
      const firstChar = email[0];
      if (firstChar) return firstChar.toUpperCase();
    }
    return '?';
  }, [user?.name, user?.email]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topSidebar}>
        Vendlyhub
        {/* <Image className={styles.logo} src="/logo.png" alt="Profile" width={32} height={32} /> */}
      </div>
      <div className={styles.left}>
        <div className={styles.separator}></div>
        {/* <div className={styles.pageTitle}>{currentPage}</div> */}
      </div>
      <div className={styles.right}>
        <Link href="/catalog/preview" className={styles.catalogButton}>
          <ExternalLink size={18} aria-hidden />
          <span>Editar meu catálogo</span>
        </Link>
        <div className={styles.userMenu}>
          <button className={styles.avatarButton} onClick={() => setShowUserMenu(!showUserMenu)}>
            {avatarUrl ? (
              // Use a simple img tag so we don't have to configure remote patterns
              <img className={styles.avatar} src={avatarUrl} alt={user?.name || 'Profile'} />
            ) : (
              <div className={styles.avatarFallback} aria-label={user?.name || 'Profile'}>
                <span>{userInitial}</span>
              </div>
            )}
          </button>
          {showUserMenu && (
            <div className={styles.userMenuDropdown}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name}</span>
                <span className={styles.userEmail}>{user?.email}</span>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/profile');
                }}
                className={styles.menuItem}
              >
                <User size={16} />
                <span>Editar Perfil</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/establishment');
                }}
                className={styles.menuItem}
              >
                <Building2 size={16} />
                <span>Editar estabelecimento</span>
              </button>
              <button onClick={handleLogout} className={styles.menuItem}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
