import React, { useState } from 'react';
import LocationPicker from './LocationPicker';
import { useLang } from '../contexts/LangContext';
import { ParcelType } from '../types';
import { PARCEL_TYPE_LABELS } from '../constants/parcelTypes';

type ParcelForm = {
  from_city: string; to_city: string; description: string; budget: string; wa: string;
  weight: string; length: string; width: string; height: string; parcel_type: ParcelType | '';
};

interface Props {
  needLogin: boolean;
  onLogin: () => void;
  onPublish: (form: Omit<ParcelForm, 'parcel_type'> & { parcel_type: ParcelType | '' }, reset: () => void, onNeedLogin: () => void, navigate: () => void) => void;
  onNavigate: () => void;
}

export default function AddParcel({ needLogin, onLogin, onPublish, onNavigate }: Props) {
  const { lang } = useLang();
  const empty: ParcelForm & { fromC: string; toC: string } = {
    fromC: '', from_city: '', toC: '', to_city: '', description: '', budget: '', wa: '',
    weight: '', length: '', width: '', height: '', parcel_type: '',
  };
  const [f, setF] = useState(empty);
  const [certified, setCertified] = useState(false);
  const up = <K extends keyof typeof empty>(k: K) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const labelLang = lang === 'ar' ? 'ar' : lang === 'en' ? 'en' : 'fr';

  return (
    <div className="container-xxl py-4 px-3 px-lg-4">
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <div className="card shadow-sm border-0 p-4">
          <div className="form-title mb-4">📦 {lang === 'ar' ? 'إرسال طرد' : lang === 'en' ? 'Send a parcel' : 'Envoyer un colis'}</div>
          {needLogin && (
            <div className="login-note p-3 rounded-3 mb-3">
              🔒 <a onClick={onLogin} style={{ cursor: 'pointer' }}>
                {lang === 'ar' ? 'سجّل الدخول' : lang === 'en' ? 'Sign in' : 'Connecte-toi'}
              </a>{' '}
              {lang === 'ar' ? 'للنشر — ستتمكن من حذف إعلانك لاحقًا.' : lang === 'en' ? 'to publish — you can delete your listing later.' : 'pour publier — tu pourras aussi supprimer ton annonce ensuite.'}
            </div>
          )}

          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
            {lang === 'ar' ? 'مدينة الانطلاق' : lang === 'en' ? 'Departure city' : 'Ville de départ'}
          </label>
          <LocationPicker country={f.fromC} city={f.from_city} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from_city: '' }))} onCity={up('from_city')} />

          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
            {lang === 'ar' ? 'مدينة الوصول' : lang === 'en' ? 'Arrival city' : "Ville d'arrivée"}
          </label>
          <LocationPicker country={f.toC} city={f.to_city} onCountry={(v) => setF((s) => ({ ...s, toC: v, to_city: '' }))} onCity={up('to_city')} legend />

          {/* Type de colis */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {lang === 'ar' ? 'نوع الطرد' : lang === 'en' ? 'Parcel type' : 'Type de colis'}
            </label>
            <div className="d-flex flex-wrap gap-2">
              {(Object.keys(PARCEL_TYPE_LABELS) as ParcelType[]).map((type) => {
                const label = PARCEL_TYPE_LABELS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    className={'chip' + (f.parcel_type === type ? ' active' : '')}
                    onClick={() => setF((s) => ({ ...s, parcel_type: s.parcel_type === type ? '' : type }))}
                  >
                    {label.icon} {label[labelLang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {lang === 'ar' ? 'وصف الطرد' : lang === 'en' ? 'Parcel description' : 'Description du colis'}
            </label>
            <textarea className="form-control" rows={3}
              placeholder={lang === 'ar' ? 'مثال: ملابس وأدوية للعائلة. حوالي 5 كغ.' : lang === 'en' ? 'E.g. Clothes and medicine for family. About 5 kg.' : 'Ex: Vêtements et médicaments pour ma famille. Environ 5 kg.'}
              value={f.description} onChange={(e) => up('description')(e.target.value)} />
          </div>

          {/* Poids */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {lang === 'ar' ? 'الوزن (كغ)' : lang === 'en' ? 'Weight (kg)' : 'Poids (kg)'}
            </label>
            <input type="number" className="form-control" min={0} max={50} step={0.1}
              placeholder={lang === 'ar' ? 'مثال: 3.5' : 'Ex: 3.5'}
              value={f.weight} onChange={(e) => up('weight')(e.target.value)} />
          </div>

          {/* Dimensions */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {lang === 'ar' ? 'الأبعاد (سم) — اختياري' : lang === 'en' ? 'Dimensions (cm) — optional' : 'Dimensions (cm) — facultatif'}
            </label>
            <div className="row g-2">
              <div className="col-4">
                <input type="number" className="form-control" min={0} max={300} step={1}
                  placeholder={lang === 'ar' ? 'الطول' : lang === 'en' ? 'Length' : 'Longueur'}
                  value={f.length} onChange={(e) => up('length')(e.target.value)} />
              </div>
              <div className="col-4">
                <input type="number" className="form-control" min={0} max={300} step={1}
                  placeholder={lang === 'ar' ? 'العرض' : lang === 'en' ? 'Width' : 'Largeur'}
                  value={f.width} onChange={(e) => up('width')(e.target.value)} />
              </div>
              <div className="col-4">
                <input type="number" className="form-control" min={0} max={300} step={1}
                  placeholder={lang === 'ar' ? 'الارتفاع' : lang === 'en' ? 'Height' : 'Hauteur'}
                  value={f.height} onChange={(e) => up('height')(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {lang === 'ar' ? 'الميزانية المقترحة (€)' : lang === 'en' ? 'Proposed budget (€)' : 'Budget proposé (€)'}
            </label>
            <input type="number" className="form-control" min={0} max={500}
              placeholder={lang === 'ar' ? 'مثال: 30' : 'Ex: 30'}
              value={f.budget} onChange={(e) => up('budget')(e.target.value)} />
          </div>

          {/* WhatsApp désactivé — messagerie interne
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {lang === 'ar' ? 'رقم واتساب' : lang === 'en' ? 'WhatsApp number' : 'Votre numéro WhatsApp'}
            </label>
            <input type="tel" className="form-control" placeholder="+33 6 12 34 56 78"
              value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              📱 {lang === 'ar' ? 'سيتصل بك المسافرون للتنسيق.' : lang === 'en' ? 'Travellers will contact you to arrange.' : 'Les voyageurs vous contacteront pour s\'arranger.'}
            </div>
          </div>
          */}

          <div className="mb-4 p-3 rounded-3" style={{ background: 'var(--bs-warning-bg-subtle, #fff3cd)', border: '1px solid var(--bs-warning-border-subtle, #ffc107)' }}>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="certifyParcel" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
              <label className="form-check-label" htmlFor="certifyParcel" style={{ fontSize: 13 }}>
                {lang === 'ar'
                  ? 'أتعهد بأن الطرد لا يحتوي على أي شيء غير قانوني وأقبل '
                  : lang === 'en'
                  ? 'I certify that this parcel contains no illegal items and I accept the '
                  : 'Je certifie que mon colis ne contient aucun objet illégal (stupéfiants, devises non déclarées, contrefaçons…) et j\'accepte les '}
                <a href="/cgu.html" target="_blank" rel="noopener">
                  {lang === 'ar' ? 'الشروط العامة للاستخدام' : lang === 'en' ? 'Terms of Use' : 'Conditions Générales d\'Utilisation'}
                </a>.
              </label>
            </div>
          </div>
          <button className="btn btn-gold w-100 py-3" disabled={!certified} onClick={() =>
            onPublish(
              {
                from_city: f.from_city, to_city: f.to_city, description: f.description,
                budget: f.budget, wa: f.wa, weight: f.weight, length: f.length,
                width: f.width, height: f.height, parcel_type: f.parcel_type,
              },
              () => { setF(empty); setCertified(false); },
              onLogin,
              onNavigate,
            )
          }>
            💳 {lang === 'ar' ? 'ادفع 3€ وانشر طردي' : lang === 'en' ? 'Pay 3€ and publish' : 'Payer 3€ et publier mon colis'}
          </button>
        </div>
      </div>
    </div>
  );
}
