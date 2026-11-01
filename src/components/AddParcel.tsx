import React, { useState } from 'react';
import LocationPicker from './LocationPicker';
import { useLang } from '../hooks/useLang';
import { ParcelType } from '../types';

type ParcelForm = {
  from_city: string; to_city: string; description: string; budget: string; wa: string;
  weight: string; length: string; width: string; height: string; parcel_type: ParcelType | '';
};

interface Props {
  needLogin: boolean;
  onLogin: () => void;
  onPublish: (form: ParcelForm, reset: () => void, onNeedLogin: () => void, navigate: () => void) => void;
  onNavigate: () => void;
}

const PARCEL_TYPE_LABELS: Record<ParcelType, { icon: string; fr: string; ar: string; en: string }> = {
  vetements:    { icon: '👕', fr: 'Vêtements',    ar: 'ملابس',       en: 'Clothes' },
  alimentaire:  { icon: '🍎', fr: 'Alimentaire',  ar: 'غذائي',       en: 'Food' },
  electronique: { icon: '📱', fr: 'Électronique', ar: 'إلكترونيات',  en: 'Electronics' },
  medicaments:  { icon: '💊', fr: 'Médicaments',  ar: 'أدوية',       en: 'Medicine' },
  documents:    { icon: '📄', fr: 'Documents',    ar: 'وثائق',       en: 'Documents' },
  autre:        { icon: '📦', fr: 'Autre',        ar: 'أخرى',        en: 'Other' },
};

export default function AddParcel({ needLogin, onLogin, onPublish, onNavigate }: Props) {
  const { lang } = useLang();
  const empty: ParcelForm & { fromC: string; toC: string } = {
    fromC: '', from_city: '', toC: '', to_city: '', description: '', budget: '', wa: '',
    weight: '', length: '', width: '', height: '', parcel_type: '',
  };
  const [f, setF] = useState(empty);
  const up = <K extends keyof typeof empty>(k: K) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const labels = {
    fr: { title: 'Envoyer un colis', depart: 'Ville de départ', arrivee: "Ville d'arrivée", desc: 'Description du colis',
          descPh: 'Ex: Vêtements et médicaments pour ma famille.', budget: 'Budget proposé (€)',
          wa: 'Votre numéro WhatsApp', waHint: "📱 Les voyageurs vous contacteront pour s'arranger.",
          poids: 'Poids (kg)', poidsOpt: 'optionnel', dims: 'Dimensions (cm)', l: 'L', larg: 'l', h: 'H',
          type: 'Type de colis', btn: '💳 Payer 3€ et publier mon colis' },
    ar: { title: 'إرسال طرد', depart: 'مدينة الانطلاق', arrivee: 'مدينة الوصول', desc: 'وصف الطرد',
          descPh: 'مثال: ملابس وأدوية للعائلة.', budget: 'الميزانية المقترحة (€)',
          wa: 'رقم واتساب', waHint: '📱 سيتصل بك المسافرون للترتيب.',
          poids: 'الوزن (كغ)', poidsOpt: 'اختياري', dims: 'الأبعاد (سم)', l: 'ط', larg: 'ع', h: 'ا',
          type: 'نوع الطرد', btn: '💳 الدفع 3€ ونشر الطرد' },
    en: { title: 'Send a parcel', depart: 'Departure city', arrivee: 'Arrival city', desc: 'Parcel description',
          descPh: 'Ex: Clothes and medicine for my family.', budget: 'Proposed budget (€)',
          wa: 'Your WhatsApp number', waHint: '📱 Travelers will contact you to arrange.',
          poids: 'Weight (kg)', poidsOpt: 'optional', dims: 'Dimensions (cm)', l: 'L', larg: 'W', h: 'H',
          type: 'Parcel type', btn: '💳 Pay 3€ and publish' },
  };
  const t = labels[lang] || labels.fr;

  return (
    <div className="container-xxl py-4 px-3 px-lg-4">
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <div className="card shadow-sm border-0 p-4">
          <div className="form-title mb-4">📦 {t.title}</div>
          {needLogin && (
            <div className="login-note p-3 rounded-3 mb-3">
              🔒 <a onClick={onLogin} style={{ cursor: 'pointer' }}>Connecte-toi</a> pour publier — tu pourras aussi supprimer ton annonce ensuite.
            </div>
          )}
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t.depart}</label>
          <LocationPicker country={f.fromC} city={f.from_city} onCountry={(v) => setF((s) => ({ ...s, fromC: v, from_city: '' }))} onCity={up('from_city')} />
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t.arrivee}</label>
          <LocationPicker country={f.toC} city={f.to_city} onCountry={(v) => setF((s) => ({ ...s, toC: v, to_city: '' }))} onCity={up('to_city')} legend />
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t.desc}</label>
            <textarea className="form-control" rows={3} placeholder={t.descPh} value={f.description} onChange={(e) => up('description')(e.target.value)} />
          </div>

          {/* Type de colis */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t.type}</label>
            <div className="d-flex flex-wrap gap-2">
              {(Object.keys(PARCEL_TYPE_LABELS) as ParcelType[]).map((pt) => {
                const lbl = PARCEL_TYPE_LABELS[pt];
                const active = f.parcel_type === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    className={`btn btn-sm ${active ? 'btn-success' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: 20, fontSize: 13 }}
                    onClick={() => setF((s) => ({ ...s, parcel_type: active ? '' : pt }))}
                  >
                    {lbl.icon} {lang === 'ar' ? lbl.ar : lang === 'en' ? lbl.en : lbl.fr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Poids */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {t.poids} <span className="text-muted fw-normal">({t.poidsOpt})</span>
            </label>
            <input type="number" className="form-control" min={0} max={300} step={0.1} placeholder="Ex: 5" value={f.weight} onChange={(e) => up('weight')(e.target.value)} />
          </div>

          {/* Dimensions */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              {t.dims} <span className="text-muted fw-normal">({t.poidsOpt})</span>
            </label>
            <div className="d-flex gap-2">
              <div className="flex-fill">
                <input type="number" className="form-control" min={0} step={0.1} placeholder={t.l} value={f.length} onChange={(e) => up('length')(e.target.value)} />
              </div>
              <div className="flex-fill">
                <input type="number" className="form-control" min={0} step={0.1} placeholder={t.larg} value={f.width} onChange={(e) => up('width')(e.target.value)} />
              </div>
              <div className="flex-fill">
                <input type="number" className="form-control" min={0} step={0.1} placeholder={t.h} value={f.height} onChange={(e) => up('height')(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t.budget}</label>
            <input type="number" className="form-control" min={0} max={500} placeholder="Ex: 30" value={f.budget} onChange={(e) => up('budget')(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>{t.wa}</label>
            <input type="tel" className="form-control" placeholder="+33 6 12 34 56 78" value={f.wa} onChange={(e) => up('wa')(e.target.value)} />
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>{t.waHint}</div>
          </div>
          <button className="btn btn-gold w-100 py-3" onClick={() =>
            onPublish(
              { from_city: f.from_city, to_city: f.to_city, description: f.description, budget: f.budget, wa: f.wa,
                weight: f.weight, length: f.length, width: f.width, height: f.height, parcel_type: f.parcel_type },
              () => setF(empty),
              onLogin,
              onNavigate,
            )
          }>{t.btn}</button>
        </div>
      </div>
    </div>
  );
}
