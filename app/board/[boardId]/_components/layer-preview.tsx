"use client";

import { LayerType } from "@/types/canvas";
import { useStorage, useSelf } from "@liveblocks/react/suspense";
import { memo } from "react";
import { Rectangle } from "./ractangle";
import { Ellipse } from "./ellipse";
import { Text } from "./text";
import { Note } from "./note";
import { Path } from "./path";
import { ImageLayer } from "./image-layer";
import { colorToCss } from "@/lib/utils";

interface LayerPreviewProps {
    id: string;
    onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
    onLayerPointerEnter?: (e: React.PointerEvent, layerId: string) => void;
    selectionColor?: string;
    isErasing?: boolean;
    eraserSize?: number;
}

export const LayerPreview = memo(({
    id,
    onLayerPointerDown,
    onLayerPointerEnter,
    selectionColor,
    isErasing,
    eraserSize = 0,
}: LayerPreviewProps) => {
    const layer = useStorage((root) => root.layers[id]);
    const eraserDraft = useSelf((me) => me.presence.eraserDraft);

    if (!layer) {
        return null;
    }

    switch (layer.type) {
        case LayerType.Path: {
            let combinedEraserStrokes = layer.eraserStrokes || [];
            if (isErasing && eraserDraft) {
                const localDraftStrokes = eraserDraft.map(p => [p[0] - layer.x, p[1] - layer.y]);
                combinedEraserStrokes = [...combinedEraserStrokes, { points: localDraftStrokes, size: eraserSize }];
            }
            return (
                <Path
                    key={id}
                    id={id}
                    points={layer.points}
                    eraserStrokes={combinedEraserStrokes}
                    onPointerDown={(e) => onLayerPointerDown(e, id)}
                    onPointerEnter={onLayerPointerEnter ? ((e) => onLayerPointerEnter(e, id)) : undefined}
                    x={layer.x}
                    y={layer.y}
                    fill={layer.fill ? colorToCss(layer.fill) : "#000"}
                    stroke={selectionColor}
                />
            );
        }
        case LayerType.Note:
            return (
                <Note
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    onPointerEnter={onLayerPointerEnter}
                    selectionColor={selectionColor}
                />
            );
        case LayerType.Text:
            return (
                <Text
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    onPointerEnter={onLayerPointerEnter}
                    selectionColor={selectionColor}
                />
            );
        case LayerType.Ellipse:
            return (
                <Ellipse
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    onPointerEnter={onLayerPointerEnter}
                    selectionColor={selectionColor}
                />
            );
        case LayerType.Rectangle:
            return (
                <Rectangle
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    onPointerEnter={onLayerPointerEnter}
                    selectionColor={selectionColor}
                />
            );
        case LayerType.Image:
            return (
                <ImageLayer
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    onPointerEnter={onLayerPointerEnter}
                    selectionColor={selectionColor}
                />
            );

        default:
            console.log("Unknown layer type", { layer });
            return null;
    }
});

LayerPreview.displayName = "LayerPreview";