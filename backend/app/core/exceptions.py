from typing import Any, Optional
from fastapi import HTTPException, status

class NotFoundException(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class UnauthorizedException(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "Access forbidden: you do not own this resource"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ValidationException(HTTPException):
    def __init__(self, detail: str = "Invalid input data"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

class AISafetyException(HTTPException):
    def __init__(self, detail: str = "Clinical emergency detected. Please seek emergency medical care immediately."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
