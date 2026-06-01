"""In-memory cache of generated stories.

Generating a multi-chapter saga is slow and costs tokens, and a given selection
should teach the same lesson every time. So we cache by the request's shape and
return the stored story on a repeat. The cache lives for the process; that is
enough to keep a session's lessons stable and fast. A persistent (on-disk) cache
could be added later if stability across restarts is wanted.
"""

from app.story.models import MultiChapterStory, Story

_CACHE: dict[str, Story | MultiChapterStory] = {}


def make_key(
    mode: str, elements: list[str], skills: list[str], difficulty: str, model: str | None
) -> str:
    return "|".join(
        [
            mode,
            difficulty,
            model or "default",
            ",".join(sorted(elements)),
            ",".join(sorted(skills)),
        ]
    )


def get(key: str) -> Story | MultiChapterStory | None:
    return _CACHE.get(key)


def put(key: str, story: Story | MultiChapterStory) -> None:
    _CACHE[key] = story


def clear() -> None:
    _CACHE.clear()
