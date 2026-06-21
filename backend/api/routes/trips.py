from fastapi import APIRouter, Depends, HTTPException, status
from godata.repos import TripRepo
from godata.models import User
from ..schemas import TripIn, TripOut
from ..auth import get_current_user, require_user

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.get("", response_model=list[TripOut])
def list_trips():
    trips = TripRepo.list_all()
    return [
        TripOut(
            id=t.id,
            name=t.name,
            from_city=t.from_city,
            to_city=t.to_city,
            date=t.date,
            capacity=t.capacity,
            weight=t.weight,
            cap_desc=t.cap_desc,
            wa=t.wa,
            owner_id=t.owner_id,
            created_at=t.created_at,
        )
        for t in trips
    ]


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(body: TripIn, user: User = Depends(require_user)):
    trip = TripRepo.create(owner_id=user.id, **body.model_dump())
    return TripOut(
        id=trip.id, name=trip.name, from_city=trip.from_city, to_city=trip.to_city,
        date=trip.date, capacity=trip.capacity, weight=trip.weight, cap_desc=trip.cap_desc,
        wa=trip.wa, owner_id=trip.owner_id, created_at=trip.created_at,
    )


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, user: User = Depends(require_user)):
    deleted = TripRepo.delete(trip_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trajet introuvable ou non autorisé")
