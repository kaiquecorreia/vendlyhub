'use client';

import Link from 'next/link';
import { Company } from '@/app/types/catalog';
import { resolveMediaUrl } from '@/app/services/mediaUrl';
import { Camera, Copy, LayoutDashboard, MapPin, Share2 } from 'lucide-react';
import styles from '../catalog.module.scss';

export interface AuthActions {
  onLogout: () => void;
  userName?: string;
}

interface CatalogHeaderProps {
  company: Company;
  previewCta?: {
    href?: string;
    label: string;
    onClick?: () => void;
    variant?: 'share' | 'copy';
  };
  previewStoreEdit?: {
    onPickLogo: (file: File) => void;
    storeDisplayName: string;
    onStoreDisplayNameChange: (name: string) => void;
  };
  onPickLogo?: (file: File) => void;
  authActions?: AuthActions;
  dashboardHref?: string;
}

export function CatalogHeader({
  company,
  previewCta,
  previewStoreEdit,
  onPickLogo,
  authActions,
  dashboardHref,
}: CatalogHeaderProps) {
  const ctaVariant = previewCta?.variant ?? 'share';
  const CtaIcon = ctaVariant === 'copy' ? Copy : Share2;

  const logoNode = company.logo ? (
    <img src={resolveMediaUrl(company.logo)} alt={company.name} className={styles.companyLogo} />
  ) : (
    <div className={styles.companyLogoPlaceholder}>{company.name.charAt(0).toUpperCase()}</div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {previewStoreEdit || onPickLogo ? (
          <div className={styles.companyLogoWrap}>
            {logoNode}
            <div className={styles.companyLogoEditOverlay}>
              <Camera size={16} aria-hidden />
              <span>Alterar foto</span>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Alterar foto da loja"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) (previewStoreEdit?.onPickLogo ?? onPickLogo)?.(file);
                event.target.value = '';
              }}
            />
          </div>
        ) : (
          logoNode
        )}
        <div className={styles.companyInfo}>
          {previewStoreEdit ? (
            <input
              type="text"
              className={styles.companyNameInput}
              value={previewStoreEdit.storeDisplayName}
              onChange={(e) => previewStoreEdit.onStoreDisplayNameChange(e.target.value)}
              placeholder="Nome da loja"
              aria-label="Nome da loja"
            />
          ) : (
            <h1 className={styles.companyName}>{company.name}</h1>
          )}
          {company.address && (
            <p className={styles.companyAddress}>
              <MapPin size={14} />
              {company.address}
            </p>
          )}
          {authActions && (
            <button
              type="button"
              className={styles.logoutButton}
              onClick={authActions.onLogout}
              title="Sair da minha conta"
            >
              <span>sair da minha conta</span>
            </button>
          )}
        </div>
      </div>
      <div className={styles.headerActions}>
        {previewCta && (
          <div className={styles.previewCtaWrap}>
            {previewCta.href ? (
              <Link
                href={previewCta.href}
                className={`${styles.previewCtaButton} ${ctaVariant === 'copy' ? styles.previewCtaButtonStatic : ''}`}
              >
                <CtaIcon size={18} aria-hidden />
                {previewCta.label}
              </Link>
            ) : (
              <button
                type="button"
                className={`${styles.previewCtaButton} ${ctaVariant === 'copy' ? styles.previewCtaButtonStatic : ''}`}
                onClick={previewCta.onClick}
              >
                <CtaIcon size={18} aria-hidden />
                {previewCta.label}
              </button>
            )}
          </div>
        )}
        {dashboardHref && (
          <Link href={dashboardHref} className={styles.dashboardButton}>
            <LayoutDashboard size={18} aria-hidden />
            <span>Dashboard</span>
          </Link>
        )}
      </div>
    </header>
  );
}
