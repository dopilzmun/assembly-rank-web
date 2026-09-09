"use client";

// 유연한 동적 키를 허용하여 TS2740 타입 불일치 에러를 방지합니다.
export type RadarStats = Record<string, number>;

export interface RadarDataset {
  label: string;
  color: string;
  fillColor: string;
  stats: RadarStats;
}

export interface RadarChartProps {
  size?: number;
  data1: RadarDataset;
  data2?: RadarDataset;
}

export default function RadarChart({ size = 240, data1, data2 }: RadarChartProps) {
  const labels = Object.keys(data1.stats);
  const totalAxes = labels.length || 6;
  const center = size / 2;
  const radius = center * 0.62; // 외곽 라벨 여백 확보

  // 중심 기준 각 꼭짓점 좌표 계산 (12시 방향부터 시계방향)
  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = ((Math.PI * 2) / totalAxes) * index - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 폴리곤 points 문자열 생성
  const getPolygonPoints = (stats: RadarStats) => {
    return labels
      .map((key, i) => {
        const val = Math.max(0, Math.min(100, stats[key] ?? 0));
        const { x, y } = getCoordinates(i, val / 100);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* 1. 배경 거미줄 방사형 그리드 */}
        {gridLevels.map((lvl) => {
          const points = Array.from({ length: totalAxes })
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={`grid-${lvl}`}
              points={points}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* 2. 중심 방사 축 선 */}
        {Array.from({ length: totalAxes }).map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* 3. 비교 대상 (Member B) 레이더 영역 */}
        {data2 && (
          <g>
            <polygon
              points={getPolygonPoints(data2.stats)}
              fill={data2.fillColor}
              stroke={data2.color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {labels.map((key, i) => {
              const val = Math.max(0, Math.min(100, data2.stats[key] ?? 0));
              const { x, y } = getCoordinates(i, val / 100);
              return (
                <circle
                  key={`dot2-${i}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={data2.color}
                />
              );
            })}
          </g>
        )}

        {/* 4. 메인 대상 (Member A) 레이더 영역 */}
        <g>
          <polygon
            points={getPolygonPoints(data1.stats)}
            fill={data1.fillColor}
            stroke={data1.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {labels.map((key, i) => {
            const val = Math.max(0, Math.min(100, data1.stats[key] ?? 0));
            const { x, y } = getCoordinates(i, val / 100);
            return (
              <circle
                key={`dot1-${i}`}
                cx={x}
                cy={y}
                r="3.5"
                fill={data1.color}
              />
            );
          })}
        </g>

        {/* 5. 꼭짓점 축 지표 텍스트 라벨 */}
        {labels.map((label, i) => {
          const { x, y } = getCoordinates(i, 1.28);
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="600"
              fill="#64748b"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}