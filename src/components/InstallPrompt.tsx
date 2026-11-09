import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import Icon from './Icons';
import {
  INSTALL_SHOW_EVENT,
  clearInstallSnooze,
  installSnoozed,
  isChromium,
  isIos,
  isStandalone,
  snoozeInstall,
  useInstallPrompt,
} from '../lib/install';

const SHOW_DELAY = 1500;

/**
 * Offers installation as soon as the app is running as a normal tab.
 *
 * Chromium normally fires `beforeinstallprompt`, captured early in index.html,
 * which lets us open the native install dialog. That event depends on browser
 * heuristics and never fires in some browsers, so Chromium without it gets the
 * manual browser-menu route instead of silence. iOS has no event at all and
 * always gets the Share → Add to Home Screen hint. Dismissals snooze for a day.
 */
export default function InstallPrompt() {
  const { t } = useI18n();
  const { available, install } = useInstallPrompt();
  const [ios] = useState(() => isIos());
  const [chromium] = useState(() => isChromium());
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const promptRef = useRef<HTMLElement>(null);

  const eligible = available || ios || chromium;

  useEffect(() => {
    if (!eligible || isStandalone()) return;
    if (installSnoozed()) return;
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  useEffect(() => {
    document.body.classList.toggle('has-install-prompt', visible);
    return () => document.body.classList.remove('has-install-prompt');
  }, [visible]);

  useLayoutEffect(() => {
    const prompt = promptRef.current;
    if (!visible || !prompt) return;

    // The metronome dock sits above this card on small screens. Publish the
    // card's real height so the dock can hug it instead of using a fixed guess
    // that leaves a gap when the copy wraps onto fewer lines.
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--install-prompt-height', `${prompt.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(prompt);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--install-prompt-height');
    };
  }, [visible]);

  useEffect(() => {
    // Settings can bring the reminder back without a reload.
    const onShow = () => {
      if (!eligible || isStandalone()) return;
      setVisible(true);
    };
    window.addEventListener(INSTALL_SHOW_EVENT, onShow);
    return () => window.removeEventListener(INSTALL_SHOW_EVENT, onShow);
  }, [eligible]);

  useEffect(() => {
    const onInstalled = () => {
      clearInstallSnooze();
      setVisible(false);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    snoozeInstall();
  };

  const runInstall = async () => {
    if (installing) return;
    setInstalling(true);
    const outcome = await install();
    setInstalling(false);
    setVisible(false);
    if (outcome !== 'accepted') snoozeInstall();
  };

  return (
    <aside ref={promptRef} className="install-prompt" role="dialog" aria-label={t('Install Cadence')}>
      <span className="install-prompt-icon">
        <Icon name="download" size={20} />
      </span>
      <div className="install-prompt-copy">
        <strong>{t('Keep Cadence with you')}</strong>
        {ios ? (
          <p>
            {t('Tap the Share button, then')} <b>{t('Add to Home Screen')}</b> {t('to install it.')}
          </p>
        ) : available ? (
          <p>{t('Install for offline practice and a full-screen, app-like experience.')}</p>
        ) : (
          <p>
            {t('Install for offline practice. Open the browser menu (')}<b>⋮</b>
            {t(') and choose')} <b>{t('Install Cadence')}</b>
            {t(', or use the install icon in the address bar.')}
          </p>
        )}
        <div className="install-prompt-actions">
          {available && (
            <button className="button primary small" onClick={() => void runInstall()} disabled={installing}>
              {installing ? t('Opening…') : t('Install app')}
            </button>
          )}
          <button className="button ghost small" onClick={dismiss}>
            {t('Not now')}
          </button>
        </div>
      </div>
      <button className="install-prompt-close" onClick={dismiss} aria-label={t('Dismiss install prompt')}>
        <Icon name="close" size={14} />
      </button>
    </aside>
  );
}
