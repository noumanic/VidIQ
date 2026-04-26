"""Keyframe extraction using OpenCV with scene-change detection."""

import asyncio
from pathlib import Path

import cv2
import numpy as np
from loguru import logger


async def extract_keyframes(
    video_path: Path, out_dir: Path, max_frames: int = 12, min_gap_sec: float = 8.0
) -> list[dict]:
    """Extract scene-change keyframes. Returns [{timestamp, image_path}]."""
    out_dir.mkdir(parents=True, exist_ok=True)

    def _run() -> list[dict]:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            logger.warning(f"Could not open video {video_path}")
            return []

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps else 0
        sample_every = max(int(fps * 1.5), 1)  # sample 1 frame every ~1.5s

        prev_hist = None
        candidates: list[tuple[float, float, np.ndarray]] = []  # (ts, score, frame)
        idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if idx % sample_every == 0:
                ts = idx / fps
                small = cv2.resize(frame, (320, 180))
                hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
                hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
                cv2.normalize(hist, hist)
                if prev_hist is None:
                    candidates.append((ts, 1.0, frame))
                else:
                    diff = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)
                    candidates.append((ts, float(diff), frame))
                prev_hist = hist
            idx += 1
        cap.release()

        if not candidates:
            return []

        # pick highest-scoring frames respecting min_gap_sec
        candidates.sort(key=lambda x: x[1], reverse=True)
        chosen: list[tuple[float, np.ndarray]] = []
        for ts, _score, frame in candidates:
            if all(abs(ts - c[0]) >= min_gap_sec for c in chosen):
                chosen.append((ts, frame))
            if len(chosen) >= max_frames:
                break
        chosen.sort(key=lambda x: x[0])

        results = []
        for ts, frame in chosen:
            fname = f"frame_{int(ts*1000):08d}.jpg"
            fpath = out_dir / fname
            cv2.imwrite(str(fpath), frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
            results.append({"timestamp": ts, "image_path": str(fpath), "duration": duration})
        return results

    return await asyncio.to_thread(_run)
