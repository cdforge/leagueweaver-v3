"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

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
  style?: CSSProperties;
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

type ConnectionCoordinates = Omit<MeasuredConnection, "path"> & {
  targetX: number;
  targetY: number;
};

type HorizontalLane = {
  y: number;
  x1: number;
  x2: number;
  sourceGameId: string;
  targetGameId: string;
};

type VerticalLane = {
  x: number;
  y1: number;
  y2: number;
  sourceGameId: string;
  targetGameId: string;
};

const EMPTY_GEOMETRY: ConnectorGeometry = {
  width: 0,
  height: 0,
  connections: [],
};

function rangesOverlap(leftA: number, leftB: number, rightA: number, rightB: number) {
  const leftMin = Math.min(leftA, leftB);
  const leftMax = Math.max(leftA, leftB);
  const rightMin = Math.min(rightA, rightB);
  const rightMax = Math.max(rightA, rightB);
  return Math.max(leftMin, rightMin) < Math.min(leftMax, rightMax) - 2;
}

function horizontalLaneOffset(index: number) {
  if (index <= 0) return 0;
  const distance = Math.ceil(index / 2) * 7;
  return index % 2 === 1 ? distance : -distance;
}

function verticalLaneOffset(index: number) {
  if (index <= 0) return 0;
  const distance = Math.ceil(index / 2) * 8;
  return index % 2 === 1 ? distance : -distance;
}

function orthogonalPath(sourceX: number, sourceY: number, targetX: number, targetY: number, outcome: BracketConnection["outcome"], laneOffset = 0, horizontalOffset = 0) {
  if (outcome === "loser") {
    const laneX = sourceX + 12 + laneOffset;
    const entryX = targetX - 8;
    if (horizontalOffset) {
      const laneY = sourceY + horizontalOffset;
      return `M ${laneX} ${sourceY} V ${laneY} H ${entryX - 8} V ${targetY} H ${entryX}`;
    }
    return `M ${laneX} ${sourceY} V ${targetY} H ${entryX}`;
  }

  const middleX = targetX > sourceX
    ? sourceX + (targetX - sourceX) / 2 + laneOffset
    : Math.max(sourceX, targetX) + 24 + laneOffset;

  if (horizontalOffset) {
    const stemX = targetX > sourceX ? Math.min(sourceX + 16, middleX) : sourceX + 16;
    const entryX = targetX - 10;
    const laneY = sourceY + horizontalOffset;
    return `M ${sourceX} ${sourceY} H ${stemX} V ${laneY} H ${entryX} V ${targetY} H ${targetX}`;
  }

  return `M ${sourceX} ${sourceY} H ${middleX} V ${targetY} H ${targetX}`;
}

function mainHorizontalLane(connection: ConnectionCoordinates, verticalOffset = 0): HorizontalLane {
  if (connection.outcome === "loser") {
    const laneX = connection.sourceX + 12 + verticalOffset;
    return {
      y: connection.targetY,
      x1: laneX,
      x2: connection.targetX - 8,
      sourceGameId: connection.sourceGameId,
      targetGameId: connection.targetGameId,
    };
  }

  const middleX = connection.targetX > connection.sourceX
    ? connection.sourceX + (connection.targetX - connection.sourceX) / 2 + verticalOffset
    : Math.max(connection.sourceX, connection.targetX) + 24 + verticalOffset;
  return {
    y: connection.sourceY,
    x1: connection.sourceX,
    x2: middleX,
    sourceGameId: connection.sourceGameId,
    targetGameId: connection.targetGameId,
  };
}

function shiftedHorizontalLane(connection: ConnectionCoordinates, verticalOffset: number, horizontalOffset: number): HorizontalLane {
  if (connection.outcome === "loser") {
    const laneX = connection.sourceX + 12 + verticalOffset;
    return {
      y: connection.sourceY + horizontalOffset,
      x1: laneX,
      x2: connection.targetX - 16,
      sourceGameId: connection.sourceGameId,
      targetGameId: connection.targetGameId,
    };
  }

  const middleX = connection.targetX > connection.sourceX
    ? connection.sourceX + (connection.targetX - connection.sourceX) / 2 + verticalOffset
    : Math.max(connection.sourceX, connection.targetX) + 24 + verticalOffset;
  const stemX = connection.targetX > connection.sourceX ? Math.min(connection.sourceX + 16, middleX) : connection.sourceX + 16;
  return {
    y: connection.sourceY + horizontalOffset,
    x1: stemX,
    x2: connection.targetX - 10,
    sourceGameId: connection.sourceGameId,
    targetGameId: connection.targetGameId,
  };
}

function mainVerticalLane(connection: ConnectionCoordinates, verticalOffset = 0): VerticalLane {
  if (connection.outcome === "loser") {
    return {
      x: connection.sourceX + 12 + verticalOffset,
      y1: connection.sourceY,
      y2: connection.targetY,
      sourceGameId: connection.sourceGameId,
      targetGameId: connection.targetGameId,
    };
  }

  const middleX = connection.targetX > connection.sourceX
    ? connection.sourceX + (connection.targetX - connection.sourceX) / 2 + verticalOffset
    : Math.max(connection.sourceX, connection.targetX) + 24 + verticalOffset;
  return {
    x: middleX,
    y1: connection.sourceY,
    y2: connection.targetY,
    sourceGameId: connection.sourceGameId,
    targetGameId: connection.targetGameId,
  };
}

export function BracketConnectorLayer({ connections, children, className, style }: BracketConnectorLayerProps) {
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
    const connectionCoordinates = connections.flatMap<ConnectionCoordinates>((connection) => {
      const source = gameElements.get(connection.sourceGameId);
      const target = gameElements.get(connection.targetGameId);
      if (!source || !target) return [];

      const sourceRect = source.getBoundingClientRect();
      const targetSlot = target.querySelector<HTMLElement>(`[data-bracket-source-id="${connection.sourceGameId}"]`);
      const targetRect = (targetSlot ?? target).getBoundingClientRect();
      const sourceX = sourceRect.right - originX;
      const sourceY = sourceRect.top + sourceRect.height / 2 - originY;
      const targetX = targetRect.left - originX;
      const targetY = targetRect.top + targetRect.height / 2 - originY;

      return [{
        ...connection,
        sourceX,
        sourceY,
        targetX,
        targetY,
      }];
    });
    const laneCounts = new Map<string, number>();
    const horizontalLanes: HorizontalLane[] = [];
    const verticalLanes: VerticalLane[] = [];
    const measuredConnections = connectionCoordinates.map<MeasuredConnection>((connection) => {
      const laneKey = `${connection.outcome}:${Math.round(connection.sourceX / 18)}:${Math.round(connection.targetX / 18)}`;
      const laneIndex = laneCounts.get(laneKey) ?? 0;
      laneCounts.set(laneKey, laneIndex + 1);
      const laneOffset = laneIndex * 8;
      const baseVerticalLane = mainVerticalLane(connection, laneOffset);
      const verticalConflicts = verticalLanes.filter((lane) => {
        const sameRoute = lane.sourceGameId === connection.sourceGameId && lane.targetGameId === connection.targetGameId;
        return !sameRoute
          && Math.abs(lane.x - baseVerticalLane.x) < 5
          && rangesOverlap(lane.y1, lane.y2, baseVerticalLane.y1, baseVerticalLane.y2);
      }).length;
      const finalLaneOffset = laneOffset + verticalLaneOffset(verticalConflicts);
      verticalLanes.push(mainVerticalLane(connection, finalLaneOffset));
      const baseLane = mainHorizontalLane(connection, finalLaneOffset);
      const conflictingLanes = horizontalLanes.filter((lane) => {
        const sharesEndpoint = lane.sourceGameId === connection.sourceGameId || lane.targetGameId === connection.targetGameId;
        return !sharesEndpoint
          && Math.abs(lane.y - baseLane.y) < 5
          && rangesOverlap(lane.x1, lane.x2, baseLane.x1, baseLane.x2);
      }).length;
      const horizontalOffset = horizontalLaneOffset(conflictingLanes);
      horizontalLanes.push(horizontalOffset
        ? shiftedHorizontalLane(connection, finalLaneOffset, horizontalOffset)
        : baseLane);
      return {
        ...connection,
        path: orthogonalPath(connection.sourceX, connection.sourceY, connection.targetX, connection.targetY, connection.outcome, finalLaneOffset, horizontalOffset),
      };
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
      style={{ ...style, position: "relative", isolation: "isolate" }}
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
          <marker id={`${markerId}-winner`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" /></marker>
          <marker id={`${markerId}-loser`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" /></marker>
        </defs>
        {[...geometry.connections].sort((left, right) => {
          if (left.outcome !== right.outcome) return left.outcome === "loser" ? -1 : 1;
          if (Boolean(left.pending) !== Boolean(right.pending)) return left.pending ? -1 : 1;
          return 0;
        }).map((connection) => {
          const isDashed = connection.outcome === "loser" || connection.pending;
          const dashPattern = connection.pending ? "3 5" : connection.outcome === "loser" ? "6 6" : undefined;
          const strokeWidth = connection.pending ? "1.5" : connection.outcome === "loser" ? "1.8" : connection.color ? "2.25" : "2";
          const opacity = connection.pending ? .34 : connection.outcome === "loser" ? .46 : connection.color ? .88 : .68;
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
              strokeWidth={strokeWidth}
              strokeDasharray={isDashed ? dashPattern : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#${markerId}-${connection.outcome})`}
              opacity={opacity}
              vectorEffect="non-scaling-stroke"
            />
          </g>;
        })}
      </svg>}
      {children}
    </div>
  );
}
