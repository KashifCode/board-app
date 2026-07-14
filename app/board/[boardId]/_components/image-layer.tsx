import { ImageLayer as ImageLayerType } from "@/types/canvas";
import Image from "next/image";

interface ImageLayerProps {
    id: string;
    layer: ImageLayerType;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    onPointerEnter?: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
}

export const ImageLayer = ({
    id,
    layer,
    onPointerDown,
    onPointerEnter,
    selectionColor,
}: ImageLayerProps) => {
    return (
        <g
            className="drop-shadow-md"
            onPointerDown={(e) => onPointerDown(e, id)}
            onPointerEnter={onPointerEnter ? (e) => onPointerEnter(e, id) : undefined}
            style={{
                transform: `translate(${layer.x}px, ${layer.y}px)`,
            }}
        >
            <foreignObject x={0} y={0} width={layer.width} height={layer.height}>
                <img
                    src={layer.src}
                    alt="Canvas Image"
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        userSelect: "none",
                        outline: selectionColor ? `2px solid ${selectionColor}` : "none",
                    }}
                />
            </foreignObject>
            <rect
                x={0}
                y={0}
                width={layer.width}
                height={layer.height}
                fill="#000"
                opacity={0}
                onPointerDown={(e) => onPointerDown(e, id)}
                className="cursor-pointer"
            />
        </g>
    );
};
