import cv2
import json
import numpy as np
import os
import tempfile
from collections import deque
from ultralytics import YOLO
from typing import Optional, Dict, Any, List
import asyncio
from pathlib import Path

class PoseAnalysisService:
    def __init__(self):
        self.model_path = "yolov8n-pose.pt"
        self.model = None
        self._load_model()
        
        # 상태 관리
        self.state = {
            "last_event_time": {},
            "last_leg_event_time": -999.0,
            "torso_fast_ema": None,
            "torso_fast_on": 0,
            "torso_fast_off": 0,
            "torso_slow_state": "idle",
            "torso_master_state": "idle",
            "torso_master_off_grace": 2,
            "torso_master_off_count": 0,
            "torso_rel_x_hist": deque(maxlen=30),
            "torso_len_hist": deque(maxlen=30),
            "head_state": "idle",
            "head_on": 0,
            "head_off": 0,
            "prev_leg_pos": None,
        }
        
        # 하이퍼파라미터
        self.STRIDE_FRAMES = 3
        self.PRINT_EVERY = 30
        self.EVENT_COOLDOWN = 2.0
        self.LEG_EVENT_COOLDOWN = 1.0
        self.LEG_MIN_CONF = 0.42
        self.LEG_MOVE_ABS_PX = 15.0
        self.LEG_MOVE_NORM = 0.025
        self.TORSO_SMOOTH_ALPHA = 0.45
        self.TORSO_START_NORM = 0.052
        self.TORSO_END_NORM = 0.030
        self.TORSO_ON_CONSEC = 2
        self.TORSO_OFF_CONSEC = 3
        self.TORSO_SPIKE_NORM = 0.085
        self.TORSO_MIN_ABS_PX = 3.0
        self.TORSO_SLOW_WIN = 30
        self.TORSO_SLOW_STD_START = 0.030
        self.TORSO_SLOW_STD_END = 0.022
        self.TORSO_SLOW_MIN_ABS_PX = 4.0
        self.HEAD_VEL_START_NORM = 0.065
        self.HEAD_VEL_END_NORM = 0.045
        self.HEAD_ON_CONSEC = 2
        self.HEAD_OFF_CONSEC = 3

    def _load_model(self):
        """YOLO 모델 로드"""
        try:
            model_path = Path(__file__).parent.parent.parent / self.model_path
            if model_path.exists():
                self.model = YOLO(str(model_path))
            else:
                # 모델이 없으면 다운로드
                self.model = YOLO(self.model_path)
            print(f"YOLO 모델 로드 완료: {self.model_path}")
        except Exception as e:
            print(f"YOLO 모델 로드 실패: {e}")
            self.model = None

    def distance(self, a, b):
        """두 점 사이의 거리 계산"""
        return float(np.linalg.norm(a - b))

    def midpoint(self, a, b):
        """두 점의 중점 계산"""
        return (a + b) / 2.0

    def valid_width(self, w):
        """유효한 너비인지 확인"""
        return (w is not None) and (w > 1e-6)

    def try_get_conf(self, results):
        """신뢰도 점수 추출"""
        try:
            return results[0].keypoints.conf.cpu().numpy()[0]
        except Exception:
            return np.ones((17,), dtype=np.float32)

    def get_face_center(self, kp):
        """얼굴 중심점 계산"""
        pts = [kp[i] for i in [0, 1, 2, 3, 4] if kp[i][0] > 0 and kp[i][1] > 0]
        if not pts:
            return None
        return np.mean(np.array(pts, dtype=np.float32), axis=0)

    def _side_of_joint(self, j_idx):
        """관절의 좌우 구분"""
        if j_idx in (13, 15):
            return "L"
        if j_idx in (14, 16):
            return "R"
        return None

    def _lower_half_threshold_y(self, keypoints, confs, side):
        """하반신 임계값 계산"""
        if side == "L":
            hip, knee, ankle = 11, 13, 15
        else:
            hip, knee, ankle = 12, 14, 16
        hip_y = float(keypoints[hip][1])
        if float(confs[ankle]) >= self.LEG_MIN_CONF:
            ankle_y = float(keypoints[ankle][1])
        elif float(confs[knee]) >= self.LEG_MIN_CONF:
            ankle_y = float(keypoints[knee][1])
        else:
            ankle_y = hip_y + max(self.distance(keypoints[5], keypoints[11]), 30.0)
        return hip_y + 0.5 * (ankle_y - hip_y)

    def can_trigger(self, event_name: str, current_time: float) -> bool:
        """이벤트 트리거 가능 여부 확인"""
        last = self.state["last_event_time"].get(event_name, -999.0)
        if current_time - last >= self.EVENT_COOLDOWN:
            self.state["last_event_time"][event_name] = current_time
            return True
        return False

    def can_trigger_leg(self, current_time: float) -> bool:
        """다리 움직임 이벤트 트리거 가능 여부 확인"""
        if current_time - self.state["last_leg_event_time"] >= self.LEG_EVENT_COOLDOWN:
            self.state["last_leg_event_time"] = current_time
            return True
        return False

    def detect_head_motion(self, keypoints, baseline_kps, torso_len, timestamp) -> List[str]:
        """고개 움직임 감지"""
        events = []
        if baseline_kps is None or not self.valid_width(torso_len):
            return events
        
        curr_face_center = self.get_face_center(keypoints)
        base_face_center = self.get_face_center(baseline_kps)
        if curr_face_center is None or base_face_center is None:
            return events
        
        norm_vel = self.distance(curr_face_center, base_face_center) / torso_len
        
        if self.state["head_state"] == "idle":
            if norm_vel >= self.HEAD_VEL_START_NORM:
                self.state["head_on"] += 1
            else:
                self.state["head_on"] = 0
            if self.state["head_on"] >= self.HEAD_ON_CONSEC:
                self.state["head_state"] = "active"
                self.state["head_on"] = 0
                self.state["head_off"] = 0
                if self.can_trigger("고개 과도 회전", timestamp):
                    events.append("고개 과도 회전")
        else:
            if norm_vel < self.HEAD_VEL_END_NORM:
                self.state["head_off"] += 1
            else:
                self.state["head_off"] = 0
            if self.state["head_off"] >= self.HEAD_OFF_CONSEC:
                self.state["head_state"] = "idle"
                self.state["head_off"] = 0
        
        return events

    def detect_leg_motion(self, keypoints, confs, torso_len, timestamp) -> List[str]:
        """다리 움직임 감지"""
        events = []
        if not self.valid_width(torso_len):
            self.state["prev_leg_pos"] = None
            return events
        
        L_mid_y = self._lower_half_threshold_y(keypoints, confs, "L")
        R_mid_y = self._lower_half_threshold_y(keypoints, confs, "R")
        pts = []
        
        for j in [13, 14, 15, 16]:
            if float(confs[j]) < self.LEG_MIN_CONF:
                continue
            side = self._side_of_joint(j)
            y_abs = float(keypoints[j][1])
            if side == "L" and y_abs >= L_mid_y:
                pts.append(keypoints[j])
            elif side == "R" and y_abs >= R_mid_y:
                pts.append(keypoints[j])
        
        if not pts:
            self.state["prev_leg_pos"] = None
            return events
        
        cur_pos = np.mean(np.array(pts, dtype=np.float32), axis=0)
        if self.state["prev_leg_pos"] is not None:
            abs_px = self.distance(cur_pos, self.state["prev_leg_pos"])
            norm = abs_px / torso_len
            if abs_px >= self.LEG_MOVE_ABS_PX and norm >= self.LEG_MOVE_NORM:
                if self.can_trigger_leg(timestamp):
                    events.append("다리 움직임")
        
        self.state["prev_leg_pos"] = cur_pos
        return events

    def detect_events(self, keypoints, confs, timestamp, baseline_kps, torso_len) -> List[str]:
        """모든 이벤트 감지"""
        events = []
        lsho, rsho = keypoints[5], keypoints[6]
        lwr, rwr = keypoints[9], keypoints[10]
        lhip, rhip = keypoints[11], keypoints[12]
        shoulder_center = self.midpoint(lsho, rsho)
        hip_center = self.midpoint(lhip, rhip)

        # 상반신 흔들림 감지
        fast_active_next = False
        if baseline_kps is not None:
            prev_shoulder_center = self.midpoint(baseline_kps[5], baseline_kps[6])
            prev_hip_center = self.midpoint(baseline_kps[11], baseline_kps[12])
            d_rel_px = abs(self.distance(shoulder_center, prev_shoulder_center) - 
                          self.distance(hip_center, prev_hip_center))
            if d_rel_px >= self.TORSO_MIN_ABS_PX:
                norm = d_rel_px / max(torso_len, 1e-6)
                if norm >= self.TORSO_SPIKE_NORM:
                    fast_active_next = True
                else:
                    if self.state["torso_fast_ema"] is None:
                        self.state["torso_fast_ema"] = norm
                    else:
                        self.state["torso_fast_ema"] = (self.TORSO_SMOOTH_ALPHA * norm + 
                                                       (1 - self.TORSO_SMOOTH_ALPHA) * self.state["torso_fast_ema"])
                    if self.state["torso_fast_ema"] >= self.TORSO_START_NORM:
                        self.state["torso_fast_on"] += 1
                    else:
                        self.state["torso_fast_on"] = 0
                    if self.state["torso_fast_ema"] <= self.TORSO_END_NORM:
                        self.state["torso_fast_off"] += 1
                    else:
                        self.state["torso_fast_off"] = 0
                    if self.state["torso_fast_on"] >= self.TORSO_ON_CONSEC:
                        fast_active_next = True
                    elif self.state["torso_fast_off"] >= self.TORSO_OFF_CONSEC:
                        fast_active_next = False

        # 상반신 흔들림 상태 업데이트
        if fast_active_next:
            if self.can_trigger("상반신 흔들림", timestamp):
                events.append("상반신 흔들림")

        # 과도한 손짓 감지
        shoulder_y_th = min(lsho[1], rsho[1])
        if (lwr[1] < shoulder_y_th and lwr[0] > 0) or (rwr[1] < shoulder_y_th and rwr[0] > 0):
            if self.can_trigger("과도한 손짓", timestamp):
                events.append("과도한 손짓")

        # 고개 움직임 감지
        events.extend(self.detect_head_motion(keypoints, baseline_kps, torso_len, timestamp))

        # 다리 움직임 감지
        events.extend(self.detect_leg_motion(keypoints, confs, torso_len, timestamp))

        return events

    async def analyze_frame(self, frame_data: bytes) -> Dict[str, Any]:
        """단일 프레임 분석"""
        if self.model is None:
            return {
                "success": False,
                "error": "YOLO 모델이 로드되지 않았습니다.",
                "events": [],
                "counts": {},
                "feedback": ["모델 로드 실패로 분석을 수행할 수 없습니다."]
            }

        try:
            # 바이트 데이터를 numpy 배열로 변환
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {
                    "success": False,
                    "error": "프레임 디코딩 실패",
                    "events": [],
                    "counts": {},
                    "feedback": ["프레임을 처리할 수 없습니다."]
                }

            # YOLO 모델로 포즈 추출
            results = self.model(frame, verbose=False)
            
            if len(results[0].keypoints.xy) == 0 or results[0].keypoints.xy.shape[1] < 17:
                return {
                    "success": True,
                    "events": [],
                    "counts": {},
                    "feedback": ["사람이 감지되지 않았습니다."]
                }

            keypoints = results[0].keypoints.xy.cpu().numpy()[0]
            confs = self.try_get_conf(results)

            # 기본 분석
            lsho, rsho = keypoints[5], keypoints[6]
            lhip, rhip = keypoints[11], keypoints[12]
            torso_len = max(self.distance((lsho + rsho) / 2.0, (lhip + rhip) / 2.0), 1e-6)

            # 이벤트 감지 (단일 프레임이므로 기본적인 감지만 수행)
            events = []
            timestamp = 0.0  # 단일 프레임이므로 시간 정보 없음

            # 과도한 손짓 감지
            lwr, rwr = keypoints[9], keypoints[10]
            shoulder_y_th = min(lsho[1], rsho[1])
            if (lwr[1] < shoulder_y_th and lwr[0] > 0) or (rwr[1] < shoulder_y_th and rwr[0] > 0):
                events.append("과도한 손짓")

            # 기본 카운트
            counts = {}
            for event in events:
                counts[event] = counts.get(event, 0) + 1

            # 피드백 생성
            feedback = self._generate_feedback(counts)

            return {
                "success": True,
                "events": events,
                "counts": counts,
                "feedback": feedback,
                "keypoints_detected": True,
                "torso_length": float(torso_len)
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"프레임 분석 중 오류: {str(e)}",
                "events": [],
                "counts": {},
                "feedback": ["분석 중 오류가 발생했습니다."]
            }

    async def analyze_video_file(self, video_path: str) -> Dict[str, Any]:
        """비디오 파일 분석"""
        if self.model is None:
            return {
                "success": False,
                "error": "YOLO 모델이 로드되지 않았습니다.",
                "events": [],
                "counts": {},
                "feedback": ["모델 로드 실패로 분석을 수행할 수 없습니다."]
            }

        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {
                    "success": False,
                    "error": f"비디오 파일을 열 수 없습니다: {video_path}",
                    "events": [],
                    "counts": {},
                    "feedback": ["비디오 파일을 처리할 수 없습니다."]
                }

            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0.0

            event_log, event_counts = [], {}
            kp_hist = deque(maxlen=self.STRIDE_FRAMES + 1)
            frame_num = 0

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_num += 1
                timestamp = frame_num / fps if fps > 0 else frame_num * (1.0 / fps)

                results = self.model(frame, verbose=False)
                if len(results[0].keypoints.xy) == 0 or results[0].keypoints.xy.shape[1] < 17:
                    self.state["prev_leg_pos"] = None
                    continue

                keypoints = results[0].keypoints.xy.cpu().numpy()[0]
                confs = self.try_get_conf(results)

                kp_hist.append(keypoints)
                if len(kp_hist) <= self.STRIDE_FRAMES:
                    continue

                baseline_kps = kp_hist[0]
                lsho, rsho = keypoints[5], keypoints[6]
                lhip, rhip = keypoints[11], keypoints[12]
                torso_len = max(self.distance((lsho + rsho) / 2.0, (lhip + rhip) / 2.0), 1e-6)

                events = self.detect_events(keypoints, confs, timestamp, baseline_kps, torso_len)
                for e in events:
                    event_log.append({"event": e, "time": round(timestamp, 2)})
                    event_counts[e] = event_counts.get(e, 0) + 1

            cap.release()

            # 피드백 생성
            feedback = self._generate_feedback(event_counts)

            return {
                "success": True,
                "events": event_log,
                "counts": dict(sorted(event_counts.items())),
                "video_info": {"fps": fps, "frames": frame_count, "duration": duration},
                "feedback": feedback
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"비디오 분석 중 오류: {str(e)}",
                "events": [],
                "counts": {},
                "feedback": ["비디오 분석 중 오류가 발생했습니다."]
            }

    def _generate_feedback(self, counts: dict) -> list[str]:
        """피드백 생성"""
        fb = []
        if counts.get("고개 과도 회전", 0) > 0:
            fb.append("고개 움직임이 자주 감지되었습니다. 면접관과 안정적인 시선 교환이 필요합니다.")
        else:
            fb.append("고개 움직임은 완벽합니다!")
        
        if counts.get("과도한 손짓", 0) > 0:
            fb.append("손동작이 과도하게 감지되었습니다. 필요한 부분에서만 사용하시기 바랍니다.")
        else:
            fb.append("손동작은 완벽합니다!")
        
        if counts.get("상반신 흔들림", 0) > 0:
            fb.append("상체 움직임이 감지되었습니다. 자세를 안정적으로 유지하세요.")
        else:
            fb.append("상체 움직임은 완벽합니다!")
        
        legs = counts.get("다리 움직임", 0)
        if legs == 0:
            fb.append("다리 움직임은 완벽합니다!")
        elif legs < 3:
            fb.append("다리 움직임은 허용 범위 내로, 괜찮습니다.")
        else:
            fb.append("다리 움직임이 잦습니다. 불필요한 긴장을 줄이고 다리를 고정하세요.")
        
        return fb

    def reset_state(self):
        """상태 초기화"""
        self.state = {
            "last_event_time": {},
            "last_leg_event_time": -999.0,
            "torso_fast_ema": None,
            "torso_fast_on": 0,
            "torso_fast_off": 0,
            "torso_slow_state": "idle",
            "torso_master_state": "idle",
            "torso_master_off_grace": 2,
            "torso_master_off_count": 0,
            "torso_rel_x_hist": deque(maxlen=30),
            "torso_len_hist": deque(maxlen=30),
            "head_state": "idle",
            "head_on": 0,
            "head_off": 0,
            "prev_leg_pos": None,
        }

# 전역 인스턴스
pose_analysis_service = PoseAnalysisService()
