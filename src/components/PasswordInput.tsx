import React, { useState } from 'react';
import { useLang } from '../contexts/LangContext';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export default function PasswordInput({ value, onChange, placeholder, autoComplete }: Props) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-group">
      <input
        type={visible ? 'text' : 'password'}
        className="form-control"
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        title={visible ? t('hidePassword') : t('showPassword')}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
}
