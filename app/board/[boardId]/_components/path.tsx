import { getSvgPathFromStroke } from "@/lib/utils";
import getStroke from "perfect-freehand";

interface PathProps {
    id?: string;
    x: number;
    y: number;
    points: number[][];
    fill: string;
    onPointerDown?: (e: React.PointerEvent) => void;
    onPointerEnter?: (e: React.PointerEvent) => void;
    stroke?: string;
    eraserStrokes?: { points: number[][], size: number }[];
}

export const Path = ({
    id,
    x,
    y,
    points,
    fill,
    onPointerDown,
    onPointerEnter,
    stroke,
    eraserStrokes,
}: PathProps) => {
    return (
        <>
            {eraserStrokes && eraserStrokes.length > 0 && (
                <mask id={`mask-${id}`}>
                    <rect x="-10000" y="-10000" width="20000" height="20000" fill="white" />
                    {eraserStrokes.map((es, i) => {
                        const d = es.points.length === 1 
                            ? `M ${es.points[0][0]} ${es.points[0][1]} L ${es.points[0][0]} ${es.points[0][1]}`
                            : es.points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
                            
                        return (
                            <path
                                key={i}
                                d={d}
                                fill="none"
                                stroke="black"
                                strokeWidth={es.size * 2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        );
                    })}
                </mask>
            )}
            <path
                className="drop-shadow-md"
                onPointerDown={onPointerDown}
                onPointerEnter={onPointerEnter}
                d={getSvgPathFromStroke(
                    getStroke(points, {
                        size: 16,
                        thinning: 0.5,
                        smoothing: 0.5,
                        streamline: 0.5,
                    })
                )}
                style={{
                    transform: `translate(${x}px, ${y}px)`
                }}
                x={0}
                y={0}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
                mask={eraserStrokes && eraserStrokes.length > 0 ? `url(#mask-${id})` : undefined}
            />
        </>
    )
}