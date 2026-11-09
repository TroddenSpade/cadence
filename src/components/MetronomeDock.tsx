import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { isStrongBeat, meterLabel, useMetronome } from '../lib/metronome';
import Icon from './Icons';

const DOCK_KEY = 'cadence.metronome.dock.collapsed';

/**
 * The always-available metronome dock. It is the "minimized device": a compact
 * floating control that can collapse to a single button and links to the full
 * settings page.
 */
export default function MetronomeDock() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { settings, running, beat, toggle, nudgeBpm } = useMetronome();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      // Start minimized unless the player has explicitly expanded the dock.
      return window.localStorage.getItem(DOCK_KEY) !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(DOCK_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore unavailable storage */
    }
  }, [collapsed]);

  // The full page replaces the dock, and the tuner needs a quiet microphone.
  if (pathname === '/metronome' || pathname === '/tuner') return null;

  if (collapsed) {
    return (
      <div className={`metronome-dock collapsed ${running ? 'running' : ''}`}>
        <button
          className="metronome-dock-fab"
          onClick={() => setCollapsed(false)}
          aria-label={t('Open the metronome')}
          title={t('Open the metronome')}
        >
          <Icon name="metronome" size={22} />
          <span className="metronome-dock-fab-bpm">{settings.bpm}</span>
          {running && <span className={`metronome-dock-pulse ${beat === 0 ? 'on' : ''}`} aria-hidden="true" />}
        </button>
      </div>
    );
  }

  return (
    <aside className={`metronome-dock ${running ? 'running' : ''}`} aria-label={t('Metronome')}>
      <div className="metronome-dock-head">
        <span className="metronome-dock-title">
          <Icon name="metronome" size={16} />
          {t('Metronome')}
        </span>
        <div className="metronome-dock-head-actions">
          <button
            className="metronome-dock-icon"
            onClick={() => setCollapsed(true)}
            aria-label={t('Minimize the metronome')}
            title={t('Minimize')}
          >
            <Icon name="chevron" size={15} />
          </button>
          <Link className="metronome-dock-icon" to="/metronome" aria-label={t('Open metronome settings')} title={t('Settings')}>
            <Icon name="settings" size={15} />
          </Link>
        </div>
      </div>

      <div className="metronome-dock-main">
        <div className="metronome-dock-tempo">
          <strong>{settings.bpm}</strong>
          <span>{t('BPM')}</span>
          <small>
            {meterLabel(settings.beatsPerBar)} ·{' '}
            {t(settings.subdivision === 'none' ? 'quarter' : settings.subdivision)}
          </small>
        </div>
        <div className="metronome-beats" aria-hidden="true">
          {Array.from({ length: settings.beatsPerBar }, (_, value) => (
            <span
              key={value}
              className={`metronome-beat ${running && beat === value ? 'active' : ''} ${
                isStrongBeat(value, settings.beatsPerBar) ? 'strong' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="metronome-dock-controls">
        <button className="metronome-dock-icon" onClick={() => nudgeBpm(-4)} aria-label={t('Slower')}>
          −
        </button>
        <button className={`metronome-dock-play ${running ? 'stop' : ''}`} onClick={toggle} aria-label={running ? t('Stop') : t('Start')}>
          <Icon name={running ? 'pause' : 'play'} size={17} />
        </button>
        <button className="metronome-dock-icon" onClick={() => nudgeBpm(4)} aria-label={t('Faster')}>
          +
        </button>
      </div>
    </aside>
  );
}
