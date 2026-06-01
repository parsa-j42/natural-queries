"""A small thread-safe LRU cache.

Used to remember recent generation results so identical requests are served
instantly without another LLM call. In-memory and per process; a shared cache
(Redis) would be the next step if the backend runs multiple instances.
"""

from collections import OrderedDict
from threading import Lock


class LRUCache[V]:
    def __init__(self, capacity: int = 256):
        self.capacity = capacity
        self._data: OrderedDict[str, V] = OrderedDict()
        self._lock = Lock()

    def get(self, key: str) -> V | None:
        with self._lock:
            if key not in self._data:
                return None
            self._data.move_to_end(key)
            return self._data[key]

    def put(self, key: str, value: V) -> None:
        with self._lock:
            self._data[key] = value
            self._data.move_to_end(key)
            while len(self._data) > self.capacity:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()

    def __len__(self) -> int:
        return len(self._data)
