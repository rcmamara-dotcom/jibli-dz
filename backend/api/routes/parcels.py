from fastapi import APIRouter, Depends, HTTPException, status
from godata.repos import ParcelRepo
from godata.models import User
from ..schemas import ParcelIn, ParcelOut
from ..auth import require_user

router = APIRouter(prefix="/api/parcels", tags=["parcels"])


@router.get("", response_model=list[ParcelOut])
def list_parcels():
    parcels = ParcelRepo.list_all()
    return [
        ParcelOut(
            id=p.id, from_city=p.from_city, to_city=p.to_city,
            description=p.description, budget=p.budget, wa=p.wa,
            owner_id=p.owner_id, created_at=p.created_at,
        )
        for p in parcels
    ]


@router.post("", response_model=ParcelOut, status_code=status.HTTP_201_CREATED)
def create_parcel(body: ParcelIn, user: User = Depends(require_user)):
    parcel = ParcelRepo.create(owner_id=user.id, **body.model_dump())
    return ParcelOut(
        id=parcel.id, from_city=parcel.from_city, to_city=parcel.to_city,
        description=parcel.description, budget=parcel.budget, wa=parcel.wa,
        owner_id=parcel.owner_id, created_at=parcel.created_at,
    )


@router.delete("/{parcel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parcel(parcel_id: int, user: User = Depends(require_user)):
    deleted = ParcelRepo.delete(parcel_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Colis introuvable ou non autorisé")
