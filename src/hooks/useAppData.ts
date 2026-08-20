import { useState, useEffect, useCallback } from 'react';
import { GoService } from '../services/GoService';
import { Trip, Parcel } from '../types';
import { waValid } from '../utils/whatsapp';

interface TokenPayload { sub: string; adm?: boolean; exp?: number; }

function decodeToken(): { userId: number | null; isAdmin: boolean } {
  const token = GoService.getToken();
  if (!token) return { userId: null, isAdmin: false };
  try {
    const payload: TokenPayload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      GoService.clearToken();
      return { userId: null, isAdmin: false };
    }
    return { userId: parseInt(payload.sub, 10), isAdmin: !!payload.adm };
  } catch {
    return { userId: null, isAdmin: false };
  }
}

export function useAppData() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [userId, setUserId] = useState<number | null>(() => decodeToken().userId);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => decodeToken().isAdmin);
  const [toast, setToast] = useState('');

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(''), 3000);
  }, []);

  const refresh = useCallback(() => {
    GoService.get<Trip[]>('/api/trips')
      .then(setTrips)
      .catch(() => showToast('⚠️ Erreur de chargement des trajets'));
    GoService.get<Parcel[]>('/api/parcels')
      .then(setParcels)
      .catch(() => showToast('⚠️ Erreur de chargement des colis'));
  }, [showToast]);

  useEffect(() => { refresh(); }, [refresh]);

  const canDelete = (item: { owner_id?: number | null }): boolean =>
    !!(userId && item.owner_id === userId);

  const login = (token: string) => {
    GoService.setToken(token);
    const decoded = decodeToken();
    setUserId(decoded.userId);
    setIsAdmin(decoded.isAdmin);
    showToast('✅ Connecté !');
  };

  const logout = () => {
    GoService.clearToken();
    setUserId(null);
    setIsAdmin(false);
    showToast('À bientôt 👋');
  };

  function publishTrip(
    form: { name: string; from_city: string; to_city: string; date: string; capacity: string; weight?: string; cap_desc?: string; wa: string },
    reset: () => void,
    onNeedLogin: () => void,
    navigate: () => void,
  ) {
    if (!userId) { showToast('🔒 Connecte-toi pour publier'); onNeedLogin(); return; }
    if (!form.name || !form.from_city || !form.to_city || !form.date || !form.wa) { showToast('⚠️ Remplissez tous les champs obligatoires'); return; }
    if (form.from_city === form.to_city) { showToast('⚠️ Départ et arrivée identiques'); return; }
    if (!waValid(form.wa)) { showToast('⚠️ Numéro WhatsApp au format international, ex : +33612345678'); return; }
    GoService.post<Trip>('/api/trips', {
      ...form,
      weight: form.weight ? parseFloat(form.weight) : null,
    })
      .then((t) => { setTrips((prev) => [t, ...prev]); reset(); showToast('✅ Trajet publié !'); navigate(); })
      .catch((e: any) => showToast('⚠️ ' + (e?.detail ?? 'Erreur')));
  }

  function publishParcel(
    form: { from_city: string; to_city: string; description: string; budget?: string; wa: string },
    reset: () => void,
    onNeedLogin: () => void,
    navigate: () => void,
  ) {
    if (!userId) { showToast('🔒 Connecte-toi pour publier'); onNeedLogin(); return; }
    if (!form.from_city || !form.to_city || !form.description || !form.wa) { showToast('⚠️ Remplissez tous les champs'); return; }
    if (form.from_city === form.to_city) { showToast('⚠️ Départ et arrivée identiques'); return; }
    if (!waValid(form.wa)) { showToast('⚠️ Numéro WhatsApp au format international, ex : +33612345678'); return; }
    GoService.post<Parcel>('/api/parcels', {
      ...form,
      budget: form.budget ? parseFloat(form.budget) : 0,
    })
      .then((p) => { setParcels((prev) => [p, ...prev]); reset(); showToast('📦 Colis publié !'); navigate(); })
      .catch((e: any) => showToast('⚠️ ' + (e?.detail ?? 'Erreur')));
  }

  function removeTrip(id: number, onClose?: () => void) {
    if (!window.confirm('Supprimer définitivement ce trajet ?')) return;
    GoService.delete(`/api/trips/${id}`)
      .then(() => { setTrips((prev) => prev.filter((t) => t.id !== id)); showToast('🗑 Trajet supprimé'); onClose?.(); })
      .catch(() => showToast('⚠️ Suppression impossible'));
  }

  function removeParcel(id: number) {
    if (!window.confirm('Supprimer définitivement ce colis ?')) return;
    GoService.delete(`/api/parcels/${id}`)
      .then(() => { setParcels((prev) => prev.filter((p) => p.id !== id)); showToast('🗑 Colis supprimé'); })
      .catch(() => showToast('⚠️ Suppression impossible'));
  }

  return { trips, parcels, userId, isAdmin, toast, showToast, canDelete, publishTrip, publishParcel, removeTrip, removeParcel, login, logout };
}
