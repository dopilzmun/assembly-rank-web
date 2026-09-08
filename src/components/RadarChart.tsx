"use client";

interface RadarDataset {
  label: string;
  color: string;       // e.g. "#4f46e5"
  fillColor: string;   // e.g. "rgba(79, 70, 229, 0.25)"
  stats: number[];     // 6개 수치 (0 ~ 100)
}

interface RadarChartProps {
  data1: RadarDataset;
  data2?: RadarDataset;
  size?: number;
}

const AXIS_LABELS = [
  "발의 규모",
  "소속위 집중",
  "심사 상정률",
  "심사 신속도",
  "본회의 가결수",
  "본회의 가결률",
];

export default function RadarChart({ data1, data2, size = 300 }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 45;
  const numAxes = 6;
  const angleStep = (Math.PI * 2) / numAxes;

  // 축 각도 및 좌표 계산 함수 (12시 방향부터 시계방향)
  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 배경 동심 육각형 생성 (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = levels.map((lvl) => {
    const points = Array.from({ length: numAxes }).map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = lvl * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    });
    return points.join(" ");
  });

  // 데이터 폴리곤 좌표 문자열 계산
  const getPointsString = (stats: number[]) => {
    return stats
      .map((val, i) => {
        const { x, y } = getCoordinates(val, i);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* 1. 배경 그리드 망 */}
        {gridPolygons.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill={idx === levels.length - 1 ? "#f8fafc" : "transparent"}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray={idx === levels.length - 1 ? undefined : "2 2"}
          />
        ))}

        {/* 2. 축 가이드 라인 */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* 3. 첫 번째 의원 데이터 폴리곤 */}
        <polygon
          points={getPointsString(data1.stats)}
          fill={data1.fillColor}
          stroke={data1.color}
          strokeWidth="2.5"
          className="transition-all duration-300"
        />
        {data1.stats.map((val, i) => {
          const { x, y } = getCoordinates(val, i);
          return (
            <circle
              key={`d1-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill={data1.color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* 4. 두 번째 의원 데이터 폴리곤 (맞비교 시) */}
        {data2 && (
          <>
            <polygon
              points={getPointsString(data2.stats)}
              fill={data2.fillColor}
              stroke={data2.color}
              strokeWidth="2.5"
              className="transition-all duration-300"
            />
            {data2.stats.map((val, i) => {
              const { x, y } = getCoordinates(val, i);
              return (
                <circle
                  key={`d2-${i}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={data2.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}
          </>
        )}

        {/* 5. 축 레이블 텍스트 */}
        {AXIS_LABELS.map((label, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = radius + 22;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);

          let anchor: "start" | "middle" | "end" = "middle";
          if (Math.cos(angle) > 0.3) anchor = "start";
          else if (Math.cos(angle) < -0.3) anchor = "end";

          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="central"
              className="text-[11px] font-semibold fill-slate-600"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* 범례 (맞비교 모드인 경우) */}
      {data2 && (
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data1.color }} />
            <span>{data1.label}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data2.color }} />
            <span>{data2.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}