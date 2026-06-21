from peewee import DoesNotExist
from ..models import Trip, User


class TripRepo:
    @staticmethod
    def list_all() -> list[Trip]:
        return list(
            Trip.select(Trip, User)
            .join(User, on=(Trip.owner == User.id), join_type="LEFT OUTER")
            .order_by(Trip.created_at.desc())
        )

    @staticmethod
    def get_by_id(trip_id: int) -> Trip | None:
        try:
            return Trip.get_by_id(trip_id)
        except DoesNotExist:
            return None

    @staticmethod
    def create(owner_id: int | None, **data) -> Trip:
        return Trip.create(owner_id=owner_id, **data)

    @staticmethod
    def delete(trip_id: int, owner_id: int) -> bool:
        deleted = (
            Trip.delete()
            .where(Trip.id == trip_id, Trip.owner_id == owner_id)
            .execute()
        )
        return deleted > 0
