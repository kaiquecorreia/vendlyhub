'use client';

import { useMemo, useState } from 'react';
import { getOnboardingMascotVideoSources } from '../services/mediaUrl';
import styles from '../onboarding-flow/styles.module.scss';

export default function OnboardingMascotVideo() {
  const [hasError, setHasError] = useState(false);
  const videoSources = useMemo(() => getOnboardingMascotVideoSources(), []);
  const fallbackImageSrc = '/media/video/mascote.png';

  return (
    <div className={styles.mascotVideoWrap} aria-hidden="true">
      {hasError ? (
        <img
          src={fallbackImageSrc}
          alt="Assistente"
          className={styles.mascotVideo}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          className={styles.mascotVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={fallbackImageSrc}
          onError={() => setHasError(true)}
        >
          {videoSources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      )}
    </div>
  );
}
