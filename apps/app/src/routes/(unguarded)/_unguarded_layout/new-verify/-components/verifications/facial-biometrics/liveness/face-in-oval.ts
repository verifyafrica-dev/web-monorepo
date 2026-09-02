export const FACE_OVAL = {
	cx: 0.5,
	cy: 0.42,
	rx: 0.28,
	ry: 0.36,
} as const;

export type Point = {
	x: number;
	y: number;
};

type VideoLayout = {
	videoWidth: number;
	videoHeight: number;
	overlayWidth: number;
	overlayHeight: number;
	mirrored: boolean;
};

function isInsideOval(point: Point, oval: typeof FACE_OVAL, slack = 1) {
	const dx = (point.x - oval.cx) / (oval.rx * slack);
	const dy = (point.y - oval.cy) / (oval.ry * slack);
	return dx * dx + dy * dy <= 1;
}

export function mapVideoPointToOverlay(
	point: Point,
	layout: VideoLayout,
): Point {
	const scale = Math.min(
		layout.overlayWidth / layout.videoWidth,
		layout.overlayHeight / layout.videoHeight,
	);
	const displayedWidth = layout.videoWidth * scale;
	const displayedHeight = layout.videoHeight * scale;
	const offsetX = (layout.overlayWidth - displayedWidth) / 2;
	const offsetY = (layout.overlayHeight - displayedHeight) / 2;
	const overlayX = (point.x * displayedWidth + offsetX) / layout.overlayWidth;
	const overlayY = (point.y * displayedHeight + offsetY) / layout.overlayHeight;

	return {
		x: layout.mirrored ? 1 - overlayX : overlayX,
		y: overlayY,
	};
}

const NOSE_TIP = 1;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

export function isFaceInOval(
	landmarks: readonly Point[],
	layout?: VideoLayout,
	oval: typeof FACE_OVAL = FACE_OVAL,
): boolean {
	const nose = landmarks[NOSE_TIP];
	const forehead = landmarks[FOREHEAD];
	const chin = landmarks[CHIN];
	const leftCheek = landmarks[LEFT_CHEEK];
	const rightCheek = landmarks[RIGHT_CHEEK];
	if (!nose || !forehead || !chin || !leftCheek || !rightCheek) {
		return false;
	}

	const mapped = [nose, forehead, chin, leftCheek, rightCheek].map((point) =>
		layout ? mapVideoPointToOverlay(point, layout) : point,
	);
	const mappedNose = mapped[0];
	if (!mappedNose || !isInsideOval(mappedNose, oval, 0.55)) {
		return false;
	}

	return mapped.every((point) => isInsideOval(point, oval, 1.2));
}
