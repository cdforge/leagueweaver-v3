"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export interface BracketConnection {
  id: string;
  sourceGameId: string;
  targetGameId: string;
  outcome: "winner" | "loser";
  pending?: boolean;
  label?: string;
  /** When a game is decided, the advancing team's (accent) color to tint the connector. */
  color?: string;
}

type BracketConnectorLayerProps = {
  connections: readonly BracketConnection[];
  children: ReactNode;
  className?: string;
};

type MeasuredConnection = BracketConnection & {
  path: string;
  sourceX: number;
  sourceY: number;
};

type ConnectorGeometry = {
  width: number;
  height: number;
  connections: MeasuredConnection[];
};

const EMPTY_GEOMETRY: ConnectorGeometry = {
  width: 0,
  height: 0,
  connections: [],
};

function orthogonalPath(sourceX: number, sourceY: number, targetX: number, targetY: number) {
  const middleX = targetX > sourceX
    ? sourceX + (targetX - sourceX) / 2
    : Math.max(sourceX, targetX) + 24;

  return `M ${sourceX} ${sourceY} H ${middleX} V ${targetY} H ${targetX}`;
}

export function BracketConnectorLayer({ connections, children, className }: BracketConnectorLayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const markerId = useId().replaceAll(":", "");
  const [geometry, setGeometry] = useState<ConnectorGeometry>(EMPTY_GEOMETRY);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const gameElements = new Map<string, HTMLElement>();
    wrapper.querySelectorAll<HTMLElement>("[data-bracket-game-id]").forEach((element) => {
      const gameId = element.dataset.bracketGameId;
      if (gameId && !gameElements.has(gameId)) gameElements.set(gameId, element);
    });

    const wrapperRect = wrapper.getBoundingClientRect();
    const originX = wrapperRect.left + wrapper.clientLeft - wrapper.scrollLeft;
    const originY = wrapperRect.top + wrapper.clientTop - wrapper.scrollTop;
    const measuredConnections = connections.flatMap<MeasuredConnection>((connection) => {
      const source = gameElements.get(connection.sourceGameId);
      const target = gameElements.get(connection.targetGameId);
      if (!source || !target) return [];

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const sourceX = sourceRect.right - originX;
      const sourceY = sourceRect.top + sourceRect.height / 2 - originY;
      const targetX = targetRect.left - originX;
      const targetY = targetRect.top + targetRect.height / 2 - originY;

      return [{
        ...connection,
        path: orthogonalPath(sourceX, sourceY, targetX, targetY),
        sourceX,
        sourceY,
      }];
    });

    setGeometry({
      width: Math.max(wrapper.clientWidth, wrapper.scrollWidth),
      height: Math.max(wrapper.clientHeight, wrapper.scrollHeight),
      connections: measuredConnections,
    });
  }, [connections]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let animationFrame = 0;
    const scheduleMeasurement = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    scheduleMeasurement();
    window.addEventListener("resize", scheduleMeasurement);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(scheduleMeasurement);
    resizeObserver?.observe(wrapper);
    wrapper.querySelectorAll<HTMLElement>("[data-bracket-game-id]").forEach((element) => {
      resizeObserver?.observe(element);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", scheduleMeasurement);
      resizeObserver?.disconnect();
    };
  }, [measure]);

  const wrapperClassName = ["bracket-connector-layer", className].filter(Boolean).join(" ");

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ position: "relative", isolation: "isolate" }}
    >
      {geometry.width > 0 && geometry.height > 0 && <svg
        aria-hidden="true"
        focusable="false"
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        style={{
          position: "absolute",
          inset: 0,
          // Sit beneath the cards: the isolate wrapper contains this negative
          // layer, so connectors show through the gaps but never paint over a
          // card face (audit H12 — "cards over lines").
          zIndex: 0,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <defs>
          <marker id={`${markerId}-winner`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" /></marker>
          <marker id={`${markerId}-loser`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" /></marker>
        </defs>
        {geometry.connections.map((connection) => {
          const isDashed = connection.outcome === "loser" || connection.pending;
          const dashPattern = connection.pending ? "3 5" : connection.outcome === "loser" ? "8 5" : undefined;
          return <g
            key={connection.id}
            className={`bracket-connection bracket-connection-${connection.outcome} ${connection.pending ? "is-pending" : ""}`}
            data-bracket-connection-id={connection.id}
            data-bracket-connection-label={connection.label}
            data-bracket-connection-outcome={connection.outcome}
            data-bracket-connection-pending={connection.pending || undefined}
            style={connection.color ? { color: connection.color } : undefined}
          >
            <path
              d={connection.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={connection.color ? "2.5" : "2"}
              strokeDasharray={isDashed ? dashPattern : undefined}
              strokeLinecap="square"
              strokeLinejoin="round"
              markerEnd={`url(#${markerId}-${connection.outcome})`}
              opacity={connection.color ? .95 : connection.pending ? .42 : connection.outcome === "loser" ? .52 : .68}
              vectorEffect="non-scaling-stroke"
            />
          </g>;
        })}
      </svg>}
      {children}
    </div>
  );
}
