from typing import List, Optional, Tuple

from fastapi import Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_seller, get_current_seller_only
from app.database import get_db


def resolve_seller_scope(
    current_user: models.User = Depends(get_current_seller),
    seller_id: Optional[int] = Query(None, description="Admin only: filter by seller id"),
    db: Session = Depends(get_db),
) -> Tuple[models.User, Optional[int], bool]:
    """
    Returns (current_user, effective_seller_id, is_aggregated_admin_view).
    - Seller: always scoped to own seller_id.
    - Admin with seller_id: scoped to that seller.
    - Admin without seller_id: aggregated across all sellers.
    """
    if current_user.role == "seller":
        if seller_id is not None and seller_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view another seller's data")
        return current_user, current_user.id, False

    if current_user.role == "admin":
        if seller_id is not None:
            seller = db.query(models.User).filter(
                models.User.id == seller_id,
                models.User.role == "seller",
            ).first()
            if not seller:
                raise HTTPException(status_code=404, detail="Seller not found")
            return current_user, seller_id, False
        return current_user, None, True

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


def resolve_seller_only_scope(
    current_user: models.User = Depends(get_current_seller_only),
) -> Tuple[models.User, Optional[int], bool]:
    """Scope for seller write actions: sellers only, always scoped to their own id."""
    return current_user, current_user.id, False
