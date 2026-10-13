"""
Casa Amara Hotel Reservation System - Room Subclasses
Demonstrates OOP Inheritance and Polymorphism.
"""

from typing import List
from src.models.base_room import BaseRoom
from src.exceptions import CapacityExceededError


class DeluxeRoom(BaseRoom):
    """
    Deluxe Room: Garden-facing retreat, up to 2 guests, ₱8,200/night.
    """
    def __init__(self):
        super().__init__(
            room_type_id="deluxe",
            name="Deluxe Room",
            base_rate=8200.0,
            max_capacity=2,
            bed_config="1 King Bed"
        )

    def calculate_cost(self, nights: int, guests: int = 2) -> float:
        if guests > self.max_capacity:
            raise CapacityExceededError(self.name, guests, self.max_capacity)
        subtotal = self.base_rate * nights
        taxes = subtotal * 0.12  # 12% hotel tax & service
        return round(subtotal + taxes, 2)

    def get_amenities(self) -> List[str]:
        return ["King bed", "Garden view", "Rainfall shower", "Complimentary Wi-Fi"]


class ExecutiveRoom(BaseRoom):
    """
    Executive Room: Terrace and soaking tub, up to 3 guests, ₱11,500/night.
    """
    def __init__(self):
        super().__init__(
            room_type_id="executive",
            name="Executive Room",
            base_rate=11500.0,
            max_capacity=3,
            bed_config="1 King Bed and Daybed"
        )

    def calculate_cost(self, nights: int, guests: int = 2) -> float:
        if guests > self.max_capacity:
            raise CapacityExceededError(self.name, guests, self.max_capacity)
        subtotal = self.base_rate * nights
        # 3rd guest includes amenity package
        if guests == 3:
            subtotal += (800.0 * nights)
        taxes = subtotal * 0.12
        return round(subtotal + taxes, 2)

    def get_amenities(self) -> List[str]:
        return ["Private terrace", "King bed & daybed", "Deep soaking tub", "Espresso machine"]


class FamilyRoom(BaseRoom):
    """
    Family Room: Inner courtyard, up to 5 guests, ₱9,800/night.
    """
    def __init__(self):
        super().__init__(
            room_type_id="family",
            name="Family Room",
            base_rate=9800.0,
            max_capacity=5,
            bed_config="2 Queen Beds"
        )

    def calculate_cost(self, nights: int, guests: int = 4) -> float:
        if guests > self.max_capacity:
            raise CapacityExceededError(self.name, guests, self.max_capacity)
        subtotal = self.base_rate * nights
        # Extra 5th guest breakfast surcharge
        if guests > 4:
            subtotal += (650.0 * nights)
        taxes = subtotal * 0.12
        return round(subtotal + taxes, 2)

    def get_amenities(self) -> List[str]:
        return ["Two queen beds", "Courtyard view", "Daily family breakfast", "Child-friendly setup"]


class PremiumSuite(BaseRoom):
    """
    Premium Suite: Most spacious retreat, lounge, up to 5 guests, ₱14,500/night.
    """
    def __init__(self):
        super().__init__(
            room_type_id="premium",
            name="Premium Suite",
            base_rate=14500.0,
            max_capacity=5,
            bed_config="1 King Bed and Sofa Bed"
        )

    def calculate_cost(self, nights: int, guests: int = 2) -> float:
        if guests > self.max_capacity:
            raise CapacityExceededError(self.name, guests, self.max_capacity)
        subtotal = self.base_rate * nights
        taxes = subtotal * 0.12
        return round(subtotal + taxes, 2)

    def get_amenities(self) -> List[str]:
        return ["Separate private lounge", "Soaking tub", "Evening turndown", "Welcome champagne", "Butler service"]


def get_room_by_id(room_id: str) -> BaseRoom:
    """Factory method to instantiate a room object by its ID."""
    rooms = {
        "deluxe": DeluxeRoom(),
        "executive": ExecutiveRoom(),
        "family": FamilyRoom(),
        "premium": PremiumSuite()
    }
    room = rooms.get(room_id.lower().strip())
    if not room:
        raise ValueError(f"Unknown room type identifier: '{room_id}'")
    return room
