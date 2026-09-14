"use client";

interface HexagonRadarChartProps {
  metrics: {
    pace: number;         // 발의 페이스 (0~100)
    aprv_cnt: number;     // 실질 가결 수 (0~100)
    aprv_rate: number;    // 가결률 (0~100)
    cmt_present: number;  // 상임위 상정률 (0~100)
    speed: number;        // 심사 신속도 (0~100)
    expertise: number;    // 상임위 전문성 (0~100)
  };
}

export default function HexagonRadarChart({ metrics }: HexagonRadarChartProps) {
  const size = 280;
  const center = size / 2;
  const radius = 95;

  const axes = [
    { label: "발의 규모", value: Math.min(100, Math.max(10, metrics.pace)) },
    { label: "실질 가결", value: Math.min(100, Math.max(10, metrics.aprv_cnt)) },
    { label: "가결 성공률", value: Math.min(100, Math.max(10, metrics.aprv_rate)) },
    { label: "상임위 상정", value: Math.min(100, Math.max(10, metrics.cmt_present)) },
    { label: "심사 신속도", value: Math.min(100, Math.max(10, metrics.speed)) },
    { label: "상임위 집중", value: Math.min(100, Math.max(10, metrics.expertise)) },
  ];

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = (val / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = radius + 26;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.value);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* 그리드 선 */}
        {gridLevels.map((lvl) => {
          const gridPoints = Array.from({ length: 6 })
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl * 100);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={lvl}
              points={gridPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={lvl === 1.0 ? "none" : "3 3"}
              className="dark:stroke-slate-700"
            />
          );
        })}

        {/* 축 라인 */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              className="dark:stroke-slate-700"
            />
          );
        })}

        {/* 데이터 영역 다각형 */}
        <polygon
          points={polygonPoints}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="#4f46e5"
          strokeWidth="2.5"
          className="dark:fill-indigo-500/30 dark:stroke-indigo-400"
        />

        {/* 포인트 점 */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, axis.value);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#4f46e5"
              className="dark:fill-indigo-400"
            />
          );
        })}

        {/* 축 레이블 */}
        {axes.map((axis, i) => {
          const { x, y } = getLabelCoordinates(i);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-600 dark:fill-slate-300 font-sans"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}