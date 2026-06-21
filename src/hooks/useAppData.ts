import { useEffect, useState, useCallback } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth, CONFIGURED } from '../firebase';
import { Trip, Parcel, Mode } from '../types';
import { TRIPS_KEY, PARCELS_KEY, lsGet, lsSet, sampleTrips, sampleParcels } from '../utils/localStorage';

export function useAppData() {
  const [mode] = useState<Mode>(CONFIGURED ? 'cloud' : 'local');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    if (CONFIGURED && db && auth) {
      const unsubT = onSnapshot(
        query(collection(db, 'trips'), orderBy('createdAt', 'desc')),
        (snap) => setTrips(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, 'id'>) }))),
        () => showToast('⚠️ Erreur de chargement des trajets'),
      );
      const unsubP = onSnapshot(
        query(collection(db, 'parcels'), orderBy('createdAt', 'desc')),
        (snap) => setParcels(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Parcel, 'id'>) }))),
        () => showToast('⚠️ Erreur de chargement des colis'),
      );
      const unsubA = onAuthStateChanged(auth, (u) => setUser(u));
      return () => { unsubT(); unsubP(); unsubA(); };
    }
    try { setTrips(JSON.parse(lsGet(TRIPS_KEY) || 'null') || sampleTrips()); } catch { setTrips(sampleTrips()); }
    try { setParcels(JSON.parse(lsGet(PARCELS_KEY) || 'null') || sampleParcels()); } catch { setParcels(sampleParcels()); }
    return undefined;
  }, [showToast]);

  useEffect(() => { if (mode === 'local') lsSet(TRIPS_KEY, JSON.stringify(trips)); }, [trips, mode]);
  useEffect(() => { if (mode === 'local') lsSet(PARCELS_KEY, JSON.stringify(parcels)); }, [parcels, mode]);

  const canDelete = useCallback((item: { ownerUid?: string }) => {
    if (mode === 'local') return true;
    return !!(user && item.ownerUid && item.ownerUid === user.uid);
  }, [mode, user]);

  async function publishTrip(
    form: Omit<Trip, 'id'>,
    reset: () => void,
    onNeedLogin: () => void,
    navigate: () => void,
  ) {
    if (mode === 'cloud' && !user) { showToast('🔒 Connecte-toi pour publier'); onNeedLogin(); return; }
    if (!form.name || !form.from || !form.to || !form.date || !form.wa) { showToast('⚠️ Remplissez tous les champs obligatoires'); return; }
    if (form.from === form.to) { showToast('⚠️ Départ et arrivée identiques'); return; }
    try {
      if (mode === 'cloud') {
        await addDoc(collection(db!, 'trips'), { ...form, ownerUid: user!.uid, createdAt: serverTimestamp() });
      } else {
        setTrips((prev) => [{ id: String(Date.now()), ...form }, ...prev]);
      }
      reset(); showToast('✅ Trajet publié avec succès !'); navigate();
    } catch (e: any) { showToast('⚠️ Échec : ' + (e.code || e.message)); }
  }

  async function publishParcel(
    form: Omit<Parcel, 'id'>,
    reset: () => void,
    onNeedLogin: () => void,
    navigate: () => void,
  ) {
    if (mode === 'cloud' && !user) { showToast('🔒 Connecte-toi pour publier'); onNeedLogin(); return; }
    if (!form.from || !form.to || !form.desc || !form.wa) { showToast('⚠️ Remplissez tous les champs'); return; }
    if (form.from === form.to) { showToast('⚠️ Départ et arrivée identiques'); return; }
    try {
      if (mode === 'cloud') {
        await addDoc(collection(db!, 'parcels'), { ...form, budget: form.budget || 0, ownerUid: user!.uid, createdAt: serverTimestamp() });
      } else {
        setParcels((prev) => [{ id: String(Date.now()), ...form, budget: form.budget || 0 }, ...prev]);
      }
      reset(); showToast('📦 Colis publié !'); navigate();
    } catch (e: any) { showToast('⚠️ Échec : ' + (e.code || e.message)); }
  }

  async function removeTrip(id: string, onClose?: () => void) {
    const t = trips.find((x) => String(x.id) === String(id));
    if (!t || !canDelete(t)) { showToast('⚠️ Action non autorisée'); return; }
    if (!window.confirm('Supprimer définitivement ce trajet ?')) return;
    try {
      if (mode === 'cloud') await deleteDoc(doc(db!, 'trips', id));
      else setTrips((prev) => prev.filter((x) => String(x.id) !== String(id)));
      showToast('🗑 Trajet supprimé'); onClose?.();
    } catch { showToast('⚠️ Suppression impossible'); }
  }

  async function removeParcel(id: string) {
    const p = parcels.find((x) => String(x.id) === String(id));
    if (!p || !canDelete(p)) { showToast('⚠️ Action non autorisée'); return; }
    if (!window.confirm('Supprimer définitivement ce colis ?')) return;
    try {
      if (mode === 'cloud') await deleteDoc(doc(db!, 'parcels', id));
      else setParcels((prev) => prev.filter((x) => String(x.id) !== String(id)));
      showToast('🗑 Colis supprimé');
    } catch { showToast('⚠️ Suppression impossible'); }
  }

  async function logout() {
    if (!auth) return;
    try { await signOut(auth); showToast('À bientôt 👋'); }
    catch { showToast('⚠️ Déconnexion impossible'); }
  }

  return { mode, trips, parcels, user, toast, showToast, canDelete, publishTrip, publishParcel, removeTrip, removeParcel, logout };
}
