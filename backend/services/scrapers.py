"""
scrapers.py — Platform Scrapers for D.A.R. Auto-Detection
==========================================================
Scrapes suspect media from Twitter/X, YouTube, and Reddit
using yt-dlp and requests. Returns a list of local file paths
for the detection pipeline to process.

Exports:
    scrape_twitter(query: str, max_results: int) -> list[dict]
    scrape_youtube(query: str, max_results: int) -> list[dict]
    scrape_reddit(subreddit: str, max_results: int) -> list[dict]
    scrape_all(queries: dict) -> list[dict]
"""

import logging
import uuid
import os
import json
import time
from pathlib import Path
from typing import Optional

logger = logging.getLogger("dar.scrapers")

TEMP_DIR = Path("/tmp/dar/scraper")
TEMP_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Shared helper: Download media via yt-dlp
# ---------------------------------------------------------------------------
def _download_media(url: str, platform: str, max_duration: int = 30) -> Optional[Path]:
    """
    Download a single media item using yt-dlp.
    Returns local file path or None on failure.
    """
    try:
        import yt_dlp

        file_id = str(uuid.uuid4())[:8]
        out_template = str(TEMP_DIR / f"{platform}_{file_id}.%(ext)s")

        ydl_opts = {
            'outtmpl': out_template,
            'format': 'best[ext=mp4][height<=720]/best[ext=mp4]/best',
            'quiet': True,
            'no_warnings': True,
            'max_filesize': 100 * 1024 * 1024,  # 100MB cap
            'socket_timeout': 30,
        }

        # For videos, limit duration
        if max_duration:
            ydl_opts['match_filter'] = lambda info: (
                'duration > %d' % max_duration
                if info.get('duration', 0) > max_duration
                else None
            )

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if info is None:
                return None

            # Find the downloaded file
            filename = ydl.prepare_filename(info)
            filepath = Path(filename)

            # yt-dlp might change extension
            if not filepath.exists():
                for p in TEMP_DIR.glob(f"{platform}_{file_id}.*"):
                    filepath = p
                    break

            if filepath.exists():
                logger.info("  ✓ Downloaded: %s (%s)", filepath.name, platform)
                return filepath

        return None

    except Exception as e:
        logger.warning("  ✗ Download failed for %s: %s", url, e)
        return None


def _download_image(url: str, platform: str) -> Optional[Path]:
    """Download a direct image URL."""
    try:
        import requests

        file_id = str(uuid.uuid4())[:8]
        response = requests.get(url, timeout=15, stream=True)
        response.raise_for_status()

        content_type = response.headers.get('content-type', '')
        ext = '.jpg'
        if 'png' in content_type:
            ext = '.png'
        elif 'webp' in content_type:
            ext = '.webp'
        elif 'gif' in content_type:
            ext = '.gif'

        filepath = TEMP_DIR / f"{platform}_{file_id}{ext}"
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        if filepath.exists() and filepath.stat().st_size > 0:
            logger.info("  ✓ Downloaded image: %s", filepath.name)
            return filepath

        return None

    except Exception as e:
        logger.warning("  ✗ Image download failed for %s: %s", url, e)
        return None


# ---------------------------------------------------------------------------
# Twitter/X Scraper
# ---------------------------------------------------------------------------
def scrape_twitter(query: str, max_results: int = 5) -> list[dict]:
    """
    Search Twitter/X for media matching a query.

    Uses yt-dlp's Twitter extractor for public posts.
    For full API access, would require Twitter API keys.

    Returns list of: { "url", "platform", "local_path", "metadata" }
    """
    logger.info("🐦 Scraping Twitter/X for: '%s' (max=%d)", query, max_results)
    results = []

    try:
        import yt_dlp

        # yt-dlp can search twitter via URL patterns
        search_url = f"https://twitter.com/search?q={query}&f=image"

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'playlist_items': f'1-{max_results}',
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(search_url, download=False)
                if info and 'entries' in info:
                    for entry in list(info['entries'])[:max_results]:
                        if entry and entry.get('url'):
                            local_path = _download_media(entry['url'], 'twitter')
                            if local_path:
                                results.append({
                                    "url": entry['url'],
                                    "platform": "twitter",
                                    "local_path": str(local_path),
                                    "metadata": {
                                        "title": entry.get('title', ''),
                                        "uploader": entry.get('uploader', ''),
                                    },
                                })
            except Exception as e:
                logger.warning("  Twitter search failed: %s", e)

    except ImportError:
        logger.error("yt-dlp not installed — cannot scrape Twitter")

    logger.info("  → Found %d items from Twitter", len(results))
    return results


# ---------------------------------------------------------------------------
# YouTube Scraper
# ---------------------------------------------------------------------------
def scrape_youtube(query: str, max_results: int = 5) -> list[dict]:
    """
    Search YouTube for videos matching a query.

    Downloads thumbnails and short clips for analysis.
    Returns list of: { "url", "platform", "local_path", "metadata" }
    """
    logger.info("📺 Scraping YouTube for: '%s' (max=%d)", query, max_results)
    results = []

    try:
        import yt_dlp

        search_url = f"ytsearch{max_results}:{query}"

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_url, download=False)
            if info and 'entries' in info:
                for entry in list(info['entries'])[:max_results]:
                    if not entry:
                        continue

                    video_url = entry.get('webpage_url') or entry.get('url')
                    thumbnail = entry.get('thumbnail')

                    # Download thumbnail for quick analysis
                    local_path = None
                    if thumbnail:
                        local_path = _download_image(thumbnail, 'youtube')

                    # If no thumbnail, try downloading a short clip
                    if not local_path and video_url:
                        local_path = _download_media(video_url, 'youtube', max_duration=10)

                    if local_path:
                        results.append({
                            "url": video_url or thumbnail,
                            "platform": "youtube",
                            "local_path": str(local_path),
                            "metadata": {
                                "title": entry.get('title', ''),
                                "channel": entry.get('channel', entry.get('uploader', '')),
                                "duration": entry.get('duration', 0),
                                "view_count": entry.get('view_count', 0),
                            },
                        })

    except ImportError:
        logger.error("yt-dlp not installed — cannot scrape YouTube")
    except Exception as e:
        logger.warning("  YouTube search error: %s", e)

    logger.info("  → Found %d items from YouTube", len(results))
    return results


# ---------------------------------------------------------------------------
# Reddit Scraper
# ---------------------------------------------------------------------------
def scrape_reddit(subreddit: str, max_results: int = 5) -> list[dict]:
    """
    Scrape images/videos from a Reddit subreddit's hot posts.

    Uses Reddit's public JSON API (no auth required for public subs).
    Returns list of: { "url", "platform", "local_path", "metadata" }
    """
    logger.info("🔴 Scraping Reddit r/%s (max=%d)", subreddit, max_results)
    results = []

    try:
        import requests

        headers = {'User-Agent': 'D.A.R. Digital Asset Referee/1.0'}
        api_url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={max_results * 2}"

        response = requests.get(api_url, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()

        posts = data.get('data', {}).get('children', [])

        for post in posts:
            if len(results) >= max_results:
                break

            post_data = post.get('data', {})
            url = post_data.get('url', '')
            is_video = post_data.get('is_video', False)

            # Check for direct image links
            image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.webp')
            is_image = any(url.lower().endswith(ext) for ext in image_extensions)

            # Reddit image domains
            is_reddit_image = 'i.redd.it' in url or 'imgur.com' in url

            local_path = None

            if is_image or is_reddit_image:
                # Direct image download
                if 'imgur.com' in url and not any(url.endswith(ext) for ext in image_extensions):
                    url = url + '.jpg'  # Imgur direct link hack
                local_path = _download_image(url, 'reddit')

            elif is_video:
                # Reddit video (use yt-dlp)
                permalink = post_data.get('permalink', '')
                reddit_url = f"https://www.reddit.com{permalink}"
                local_path = _download_media(reddit_url, 'reddit', max_duration=30)

            if local_path:
                results.append({
                    "url": url,
                    "platform": "reddit",
                    "local_path": str(local_path),
                    "metadata": {
                        "title": post_data.get('title', ''),
                        "author": post_data.get('author', ''),
                        "subreddit": subreddit,
                        "score": post_data.get('score', 0),
                    },
                })

    except ImportError:
        logger.error("requests not installed — cannot scrape Reddit")
    except Exception as e:
        logger.warning("  Reddit scrape error: %s", e)

    logger.info("  → Found %d items from Reddit", len(results))
    return results


# ---------------------------------------------------------------------------
# Unified scraper
# ---------------------------------------------------------------------------
def scrape_all(queries: dict = None) -> list[dict]:
    """
    Run all scrapers with the given queries.

    Args:
        queries: Dict with platform-specific search parameters:
            {
                "twitter": {"query": "NFL highlights", "max_results": 5},
                "youtube": {"query": "NBA game clips", "max_results": 5},
                "reddit":  {"subreddit": "sports", "max_results": 5},
            }

    Returns:
        Combined list of all scraped media items.
    """
    if queries is None:
        queries = {
            "twitter": {"query": "sports highlights clip", "max_results": 3},
            "youtube": {"query": "sports game highlights 2024", "max_results": 3},
            "reddit": {"subreddit": "sports", "max_results": 3},
        }

    all_results = []

    if "twitter" in queries:
        q = queries["twitter"]
        all_results.extend(
            scrape_twitter(q.get("query", "sports"), q.get("max_results", 3))
        )

    if "youtube" in queries:
        q = queries["youtube"]
        all_results.extend(
            scrape_youtube(q.get("query", "sports"), q.get("max_results", 3))
        )

    if "reddit" in queries:
        q = queries["reddit"]
        all_results.extend(
            scrape_reddit(q.get("subreddit", "sports"), q.get("max_results", 3))
        )

    logger.info("📊 Total scraped: %d items across %d platforms",
                len(all_results), len(queries))
    return all_results
