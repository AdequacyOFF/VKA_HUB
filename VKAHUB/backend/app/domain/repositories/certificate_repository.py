"""Certificate repository interface"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class CertificateRepository(ABC):
    """Abstract certificate repository interface"""

    @abstractmethod
    async def create(self, certificate_data: Dict[str, Any]):
        """Create a new certificate"""
        pass

    @abstractmethod
    async def get_by_id(self, certificate_id: int):
        """Get certificate by ID"""
        pass

    @abstractmethod
    async def update(self, certificate_id: int, certificate_data: Dict[str, Any]):
        """Update certificate"""
        pass

    @abstractmethod
    async def delete(self, certificate_id: int) -> bool:
        """Delete certificate"""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: int) -> List:
        """List all certificates for a user"""
        pass
