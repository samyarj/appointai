from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.user import UserSchema, ProfileUpdateSchema
from app.models import User

router = APIRouter()

@router.get("/me", response_model=UserSchema)
@router.get("/auth/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserSchema(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=current_user.avatar,
        join_date=current_user.join_date.isoformat() if current_user.join_date else None,
        timezone=current_user.timezone,
        date_format=current_user.date_format,
        time_format=current_user.time_format,
        theme=current_user.theme,
        notifications=current_user.notifications,
        privacy=current_user.privacy,
        is_verified=current_user.is_verified,
    )

@router.get("/profile", response_model=UserSchema)
def get_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile (alias for /me but maybe used differently in frontend)"""
    return UserSchema(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=current_user.avatar,
        join_date=current_user.join_date.isoformat() if current_user.join_date else None,
        timezone=current_user.timezone,
        date_format=current_user.date_format,
        time_format=current_user.time_format,
        theme=current_user.theme,
        notifications=current_user.notifications,
        privacy=current_user.privacy,
        is_verified=current_user.is_verified,
    )

@router.put("/profile", response_model=UserSchema)
def update_profile(
    profile_data: ProfileUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Get the user from the current database session
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert Pydantic model to dict and filter out None values
        update_data = profile_data.dict(exclude_unset=True)
        
        if not update_data:
            return UserSchema(
                id=user.id,
                name=user.name,
                email=user.email,
                avatar=user.avatar,
                join_date=user.join_date.isoformat() if user.join_date else None,
                timezone=user.timezone,
                date_format=user.date_format,
                time_format=user.time_format,
                theme=user.theme,
                notifications=user.notifications,
                privacy=user.privacy,
                is_verified=user.is_verified,
            )
        
        # Validate email uniqueness if email is being updated
        if "email" in update_data and update_data["email"] != user.email:
            existing_user = db.query(User).filter(User.email == update_data["email"]).first()
            if existing_user and existing_user.id != user.id:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Update only the fields that were provided
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        # Commit the changes
        db.commit()
        db.refresh(user)
        
        return UserSchema(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar,
            join_date=user.join_date.isoformat() if user.join_date else None,
            timezone=user.timezone,
            date_format=user.date_format,
            time_format=user.time_format,
            theme=user.theme,
            notifications=user.notifications,
            privacy=user.privacy,
            is_verified=user.is_verified,
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"Profile update error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")
