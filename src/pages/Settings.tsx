import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Icon from '../components/Icons';
import { synth } from '../lib/audio';
import type { IconName } from '../components/Icons';
import { ALL_LESSONS, COURSES } from '../data/curriculum';
import { levelFromXp, syncStatusLabel, todayKey, useProgress, type InstrumentMode } from '../lib/progress';
import { isEmailCodeComplete, normalizeEmailCode } from '../lib/otp';
import type { NoteNaming } from '../lib/music';
import { LANGUAGES, useI18n } from '../lib/i18n';
import { instrumentById } from '../lib/tunings';
import {
  installSnoozed,
  isChromium,
  isIos,
  isStandalone,
  showInstallPromptNow,
  snoozeInstall,
  useInstallPrompt,
} from '../lib/install';

const INSTRUMENTS: Array<{ id: InstrumentMode; title: string; description: string; icon: IconName }> = [
  {
    id: 'piano',
    title: 'Piano keys',
    description: 'Two octaves of keyboard for finding notes, chords, and scales.',
    icon: 'piano',
  },
  {
    id: 'guitar',
    title: 'Guitar fretboard',
    description: 'Standard tuning, twelve frets, all six strings.',
    icon: 'guitar',
  },
  {
    id: 'both',
    title: 'Both surfaces',
    description: 'Show piano and guitar together. Answer on either one.',
    icon: 'music',
  },
];

const NAMING_OPTIONS: Array<{ id: NoteNaming; title: string; example: string; description: string }> = [
  {
    id: 'letters',
    title: 'ABC',
    example: 'C · D · E',
    description: 'Letter names only, the standard in English theory.',
  },
  {
    id: 'solfege',
    title: 'Do Re Mi',
    example: 'Do · Re · Mi',
    description: 'Solfège only, with fixed do for every written note.',
  },
  {
    id: 'both',
    title: 'Both',
    example: 'C (Do) · D (Re)',
    description: 'Show the letter and its solfège translation together.',
  },
];

function InstallRow() {
  const { t } = useI18n();
  const { available, install } = useInstallPrompt();
  const [installed] = useState(() => isStandalone());
  const [ios] = useState(() => isIos());
  const [chromium] = useState(() => isChromium());
  const [busy, setBusy] = useState(false);
  const [snoozed, setSnoozed] = useState(() => installSnoozed());

  const run = async () => {
    setBusy(true);
    const outcome = await install();
    setBusy(false);
    if (outcome !== 'accepted') snoozeInstall();
  };

  return (
    <div className="backup-row install-row">
      <div>
        <strong>{t('Install app')}</strong>
        <p>
          {installed
            ? t('Cadence is installed and runs in its own window.')
            : t('Add Cadence to your home screen or desktop for offline practice and a full-screen experience.')}
        </p>
      </div>
      <div className="button-row">
        {installed ? (
          <span className="install-state">
            <Icon name="check" size={14} /> {t('Installed')}
          </span>
        ) : available ? (
          <button className="button primary small" onClick={() => void run()} disabled={busy}>
            {busy ? t('Opening…') : t('Install app')}
          </button>
        ) : snoozed ? (
          <button
            className="button ghost small"
            onClick={() => {
              showInstallPromptNow();
              setSnoozed(false);
            }}
          >
            {t('Show reminder')}
          </button>
        ) : ios ? (
          <span className="install-hint">{t('Share → Add to Home Screen')}</span>
        ) : chromium ? (
          <span className="install-hint">{t('Address-bar install icon, or ⋮ → Install Cadence')}</span>
        ) : (
          <span className="install-hint">{t('Try Chrome, Edge, or Safari on iOS')}</span>
        )}
      </div>
    </div>
  );
}


function AccountPanel() {
  const { t, formatDate } = useI18n();
  const { configured, status, email, lastSyncedAt, syncError, signIn, verifyEmailCode, signOut, syncNow } =
    useProgress();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const target = address.trim();
    if (!target) return;
    setBusy(true);
    setNotice(null);
    setCodeError(null);
    const result = await signIn(target);
    setBusy(false);
    if (result.ok) {
      setCode('');
      setCodeSentTo(target);
      setNotice(
        t('Check {email} for a 6-digit sign-in code. Enter it below.', {
          email: target,
        }),
      );
    } else {
      setNotice(result.error ?? t('Could not send the link.'));
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!codeSentTo || !isEmailCodeComplete(code)) return;
    setCodeBusy(true);
    setCodeError(null);
    const result = await verifyEmailCode(codeSentTo, code);
    setCodeBusy(false);
    if (!result.ok) {
      setCodeError(
        t(result.error ?? 'That code is incorrect or has expired. Request a new one.'),
      );
      return;
    }
    setCode('');
    setNotice(null);
    setCodeSentTo(null);
  };

  return (
    <section className="panel settings-panel account-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('Account')}</span>
          <h2>{t('Sync across phone and computer')}</h2>
        </div>
        <span className={`sync-pill ${status}`}>
          <span className="sync-dot" />
          {t(syncStatusLabel[status])}
        </span>
      </div>

      {!configured ? (
        <p className="settings-note">
          {t('Cross-device sync is not configured in this build, so progress stays on this device. Set')}{' '}
          <code>VITE_SUPABASE_URL</code> {t('and')} <code>VITE_SUPABASE_ANON_KEY</code>{' '}
          {t(
            'when building to enable accounts — the README has the setup steps. You can still move progress between devices with a backup file.',
          )}
        </p>
      ) : email ? (
        <div className="sync-account">
          <div className="sync-identity">
            <span className="sync-avatar">
              <Icon name="user" size={20} />
            </span>
            <div>
              <strong>{email}</strong>
              <small>
                {syncError
                  ? syncError
                  : status === 'synced'
                    ? t('Last synced {date}', {
                        date: lastSyncedAt
                          ? formatDate(new Date(lastSyncedAt), { dateStyle: 'medium', timeStyle: 'short' })
                          : t('not yet'),
                      })
                    : t(syncStatusLabel[status])}
              </small>
            </div>
          </div>
          <div className="button-row">
            <button
              className="button secondary small"
              onClick={() => void syncNow()}
              disabled={status === 'syncing'}
            >
              <Icon name="refresh" size={14} /> {t('Sync now')}
            </button>
            <button className="button ghost small" onClick={() => void signOut()}>
              {t('Sign out')}
            </button>
          </div>
          <p className="settings-note">
            {t(
              'Practice works offline. Changes merge with your account when you reconnect, and resetting progress on one device clears it everywhere.',
            )}
          </p>
        </div>
      ) : (
        <>
          <form className="sync-form" onSubmit={submit}>
            <p className="settings-note">
              {t(
                'Sign in with a one-time code — no password to remember. Your lessons, reviews, XP, and streaks then follow you between devices. Progress stays on this device and keeps working offline.',
              )}
            </p>
            <div className="sync-input-row">
              <label className="sr-only" htmlFor="sync-email">
                {t('Email address')}
              </label>
              <input
                id="sync-email"
                className="sync-input"
                type="email"
                required
                autoComplete="email"
                placeholder={t('you@example.com')}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
              <button className="button primary small" type="submit" disabled={busy}>
                {busy ? t('Sending…') : t('Email me a code')}
              </button>
            </div>
            {notice && <p className="sync-notice">{notice}</p>}
          </form>
          {codeSentTo && (
            <form className="sync-form sync-code-form" onSubmit={verify}>
              <label className="sr-only" htmlFor="sync-code">
                {t('Sign-in code')}
              </label>
              <div className="sync-input-row">
                <input
                  id="sync-code"
                  className="sync-input sync-code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  placeholder={t('6-digit code')}
                  value={code}
                  onChange={(event) => setCode(normalizeEmailCode(event.target.value))}
                />
                <button
                  className="button primary small"
                  type="submit"
                  disabled={codeBusy || !isEmailCodeComplete(code)}
                >
                  {codeBusy ? t('Verifying…') : t('Verify code')}
                </button>
              </div>
              {codeError ? (
                <p className="sync-notice sync-notice-error">{codeError}</p>
              ) : (
                <p className="settings-note">{t('Use the code from the email. It expires after one hour.')}</p>
              )}
            </form>
          )}
        </>
      )}
    </section>
  );
}

export default function Settings() {
  const { state, updateSettings, resetProgress, resetAll, exportProgress, importProgress } = useProgress();
  const { t, language, setLanguage } = useI18n();
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const levelInfo = levelFromXp(state.xp);

  const exportBackup = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cadence-backup-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    const confirmed = window.confirm(
      t(
        'Replace the progress on this device with this backup? If you are signed in, the synced copy is replaced too.',
      ),
    );
    if (!confirmed) return;
    const result = importProgress(text);
    window.alert(result.ok ? t('Backup restored.') : (result.error ?? t('Could not restore that backup.')));
  };

  const testTone = (timbre: 'piano' | 'guitar') => {
    synth.setTimbre(timbre);
    synth.stopAll();
    synth.playSequence([60, 64, 67, 72], 'sequence', 0.34);
  };

  return (
    <div className="page settings-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('Preferences')}</span>
          <h1>{t('Settings')}</h1>
          <p>
            {t(
              'Shape how Cadence looks and sounds. Instrument choices apply everywhere — lessons, daily practice, and trainer drills.',
            )}
          </p>
        </div>
        <div className="header-stat settings-level">
          <span>{t('Your level')}</span>
          <strong>
            {levelInfo.level} · {t(levelInfo.title)}
          </strong>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.round(levelInfo.progress * 100)}%` }} />
          </div>
          <small>{t('{n} XP total', { n: state.xp })}</small>
        </div>
      </header>

      <div className="settings-grid">
        <AccountPanel />

        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('Language')}</span>
              <h2>{t('Language & direction')}</h2>
            </div>
          </div>
          <p className="settings-note">
            {t(
              'Pick the language for menus, lessons, and instructions. The change applies immediately and is remembered on this device.',
            )}
          </p>
          <div className="timbre-row">
            {LANGUAGES.map((option) => {
              const active = language === option.id;
              return (
                <button
                  key={option.id}
                  className={`instrument-choice ${active ? 'selected' : ''}`}
                  onClick={() => setLanguage(option.id)}
                  aria-pressed={active}
                >
                  <strong>{option.id === 'en' ? t('English') : t('فارسی (Persian)')}</strong>
                  <small>{option.id === 'en' ? t('Left-to-right layout') : t('Right-to-left layout')}</small>
                  {active && (
                    <span className="choice-check">
                      <Icon name="check" size={13} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="settings-note">
            {t(
              'Persian uses a right-to-left layout, so the whole interface mirrors and text flows from right to left.',
            )}
          </p>
        </section>

        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('Instrument')}</span>
              <h2>{t('What should you see in practice?')}</h2>
            </div>
          </div>
          <div className="instrument-choice-grid">
            {INSTRUMENTS.map((instrument) => (
              <button
                key={instrument.id}
                className={`instrument-choice ${state.settings.instrument === instrument.id ? 'selected' : ''}`}
                onClick={() => updateSettings({ instrument: instrument.id })}
              >
                <span className="instrument-choice-icon">
                  <Icon name={instrument.icon} size={24} />
                </span>
                <strong>{t(instrument.title)}</strong>
                <small>{t(instrument.description)}</small>
                {state.settings.instrument === instrument.id && (
                  <span className="choice-check">
                    <Icon name="check" size={13} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="settings-note">
            {t(
              'Labels are hidden while you answer instrument questions, then revealed with the feedback. This keeps note-finding a real test.',
            )}
          </p>
          {state.settings.instrument !== 'piano' && (
            <div className="tuning-setting">
              <label htmlFor="guitar-tuning">
                <strong>{t('Guitar tuning')}</strong>
                <small>
                  {t(
                    'Applied to fretboard exercises, repertoire, and the scale & chord explorer. Lesson examples keep the tuning written in the text.',
                  )}
                </small>
              </label>
              <select
                id="guitar-tuning"
                value={state.settings.guitarTuning}
                onChange={(event) => updateSettings({ guitarTuning: event.target.value })}
              >
                {instrumentById('guitar').tunings.map((tuning) => (
                  <option key={tuning.id} value={tuning.id}>
                    {t(tuning.name)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('Note names')}</span>
              <h2>{t('ABC or Do Re Mi?')}</h2>
            </div>
          </div>
          <div className="naming-choice">
            {NAMING_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`naming-option ${state.settings.noteNaming === option.id ? 'selected' : ''}`}
                onClick={() => updateSettings({ noteNaming: option.id })}
              >
                <span className="naming-title">{t(option.title)}</span>
                <span className="naming-example">{option.example}</span>
                <small>{t(option.description)}</small>
                {state.settings.noteNaming === option.id && (
                  <span className="choice-check">
                    <Icon name="check" size={13} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="settings-note">
            {t('Applies to lessons, exercises, staff examples, and the piano and guitar labels.')}{' '}
            <strong>{t('Both')}</strong> {t('is the default; solfège uses fixed do, so C is always Do.')}
          </p>
        </section>

        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('Sound')}</span>
              <h2>{t('Timbre & audio')}</h2>
            </div>
          </div>
          <div className="timbre-row">
            {(['piano', 'guitar'] as const).map((timbre) => (
              <div key={timbre} className={`timbre-card ${state.settings.timbre === timbre ? 'selected' : ''}`}>
                <button className="timbre-select" onClick={() => updateSettings({ timbre })}>
                  <Icon name={timbre === 'piano' ? 'piano' : 'guitar'} size={20} />
                  <span>
                    <strong>{timbre === 'piano' ? t('Piano tone') : t('Guitar tone')}</strong>
                    <small>{timbre === 'piano' ? t('Warm, sustained') : t('Plucked string')}</small>
                  </span>
                  {state.settings.timbre === timbre && <Icon name="check" size={15} />}
                </button>
                <button className="button ghost small" onClick={() => testTone(timbre)}>
                  <Icon name="play" size={14} /> {t('Test')}
                </button>
              </div>
            ))}
          </div>
          <div className="setting-rows">
            <label className="setting-row">
              <span>
                <strong>{t('Auto-play listening questions')}</strong>
                <small>{t('Hear intervals, chords, and progressions automatically.')}</small>
              </span>
              <input
                type="checkbox"
                className="switch"
                checked={state.settings.autoPlay}
                onChange={(event) => updateSettings({ autoPlay: event.target.checked })}
              />
            </label>
            <label className="setting-row">
              <span>
                <strong>{t('Note labels on instruments')}</strong>
                <small>{t('Show note names outside of quizzes.')}</small>
              </span>
              <input
                type="checkbox"
                className="switch"
                checked={state.settings.showLabels}
                onChange={(event) => updateSettings({ showLabels: event.target.checked })}
              />
            </label>
            <label className="setting-row">
              <span>
                <strong>{t('Sound enabled')}</strong>
                <small>{t('Mute all audio while keeping the visual drills.')}</small>
              </span>
              <input
                type="checkbox"
                className="switch"
                checked={state.settings.sound}
                onChange={(event) => updateSettings({ sound: event.target.checked })}
              />
            </label>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('Habit')}</span>
              <h2>{t('Daily goal')}</h2>
            </div>
          </div>
          <p className="settings-note">
            {t(
              'Questions answered per day. A smaller goal kept daily beats a large goal abandoned.',
            )}
          </p>
          <div className="goal-options">
            {[10, 20, 30, 40].map((goal) => (
              <button
                key={goal}
                className={`goal-option ${state.settings.dailyGoal === goal ? 'selected' : ''}`}
                onClick={() => updateSettings({ dailyGoal: goal })}
              >
                <strong>{goal}</strong>
                <span>{t('questions')}</span>
              </button>
            ))}
          </div>
          <div className="setting-rows">
            <div className="setting-row static">
              <span>
                <strong>{t('Current streak')}</strong>
                <small>{t('Best streak: {n} days', { n: state.bestStreak })}</small>
              </span>
              <span className="setting-value">
                <Icon name="flame" size={17} /> {t('{n} days', { n: state.streak })}
              </span>
            </div>
            <div className="setting-row static">
              <span>
                <strong>{t('Skills tracked')}</strong>
                <small>{t('Each one has its own review schedule.')}</small>
              </span>
              <span className="setting-value">{Object.keys(state.skills).length}</span>
            </div>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('About')}</span>
              <h2>{t('Cadence')}</h2>
            </div>
            <span className="topic-chip muted">v0.1</span>
          </div>
          <p className="settings-note">
            {t(
              'A web-first music theory trainer built with React. It works offline once loaded, can be installed to your home screen, and is ready to wrap as an Android app with Capacitor.',
            )}
          </p>
          <div className="about-list">
            <div>
              <Icon name="piano" size={18} />
              <span>
                {t('{courses} courses · {lessons} lessons · piano & guitar', {
                  courses: COURSES.length,
                  lessons: ALL_LESSONS.length,
                })}
              </span>
            </div>
            <div>
              <Icon name="headphones" size={18} />
              <span>{t('Reading, listening, and instrument drills')}</span>
            </div>
            <div>
              <Icon name="refresh" size={18} />
              <span>{t('Spaced review that adapts to every answer')}</span>
            </div>
            <div>
              <Icon name="music" size={18} />
              <span>{t('Local-first progress, with optional cross-device sync')}</span>
            </div>
          </div>
          <InstallRow />
          <p className="settings-fineprint">{t('Android packaging instructions are in the project README.')}</p>
        </section>

        <section className="panel settings-panel danger-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('Data')}</span>
              <h2>{t('Backup & reset')}</h2>
            </div>
          </div>
          <div className="backup-row">
            <div>
              <strong>{t('Backup file')}</strong>
              <p>{t('Save a JSON snapshot, or restore one here or on another device.')}</p>
            </div>
            <div className="button-row">
              <button className="button secondary small" onClick={exportBackup}>
                {t('Export backup')}
              </button>
              <button className="button ghost small" onClick={() => fileRef.current?.click()}>
                {t('Import')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => void importBackup(event)}
              />
            </div>
          </div>
          <div className="danger-actions">
            <div>
              <strong>{t('Reset progress only')}</strong>
              <p>{t('Clears lessons, skills, XP, and streaks. Keeps your instrument and audio settings.')}</p>
              <button
                className="button secondary small"
                onClick={() => {
                  if (window.confirm(t('Reset all learning progress? This cannot be undone.'))) resetProgress();
                }}
              >
                {t('Reset progress')}
              </button>
            </div>
            <div>
              <strong>{t('Reset everything')}</strong>
              <p>{t('Also restores the default instrument, timbre, and daily goal.')}</p>
              <button
                className="button danger small"
                onClick={() => {
                  if (confirmReset) {
                    resetAll();
                    setConfirmReset(false);
                  } else {
                    setConfirmReset(true);
                    window.setTimeout(() => setConfirmReset(false), 4000);
                  }
                }}
              >
                {confirmReset ? t('Tap again to confirm') : t('Reset all settings & progress')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
