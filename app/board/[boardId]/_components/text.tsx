import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { useRef, useEffect } from "react";
import { cn, colorToCss } from "@/lib/utils";
import { TextLayer } from "@/types/canvas";
import { useMutation } from "@liveblocks/react/suspense";

const font = Kalam({
    subsets: ["latin"],
    weight: ["400"],
})

interface TextProps {
    id: string;
    layer: TextLayer;   
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    onPointerEnter?: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
};

export const Text = ({
    id,
    layer,
    onPointerDown,
    onPointerEnter,
    selectionColor
}: TextProps) => {
    const { x, y, width, height, fill, value, fontSize } = layer;
    const measureRef = useRef<HTMLDivElement>(null);

    const updateValue = useMutation((
        { storage },
        newValue: string,
    ) => {
        const liveLayers = storage.get("layers");
        liveLayers.get(id)?.set("value", newValue);
    }, [id]);

    const updateSize = useMutation((
        { storage },
        newWidth: number,
        newHeight: number,
    ) => {
        const liveLayers = storage.get("layers");
        const liveLayer = liveLayers.get(id);
        if (liveLayer) {
            liveLayer.set("width", newWidth);
            liveLayer.set("height", newHeight);
        }
    }, [id]);

    const handleContentChange = (e: ContentEditableEvent) => {
        updateValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            document.execCommand('insertLineBreak');
        }
    };

    useEffect(() => {
        if (measureRef.current) {
            const newWidth = Math.max(100, measureRef.current.offsetWidth + 24);
            const newHeight = Math.max(40, measureRef.current.offsetHeight + 24);
            
            if (Math.abs(newWidth - width) > 5 || Math.abs(newHeight - height) > 5) {
                updateSize(newWidth, newHeight);
            }
        }
    }, [value, fontSize, updateSize, width, height]);

    const currentFontSize = fontSize || 32;

    return (
        <foreignObject
            x={x}
            y={y}
            width={width}
            height={height}
            onPointerDown={(e) => onPointerDown(e, id)}
            onPointerEnter={onPointerEnter ? (e) => onPointerEnter(e, id) : undefined}
            style={{
                outline: selectionColor ? `1px solid ${selectionColor}`: 'none'
            }}
        >
            <div 
                ref={measureRef}
                style={{
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    visibility: 'hidden',
                    whiteSpace: 'pre-wrap',
                    fontSize: `${currentFontSize}px`,
                    fontFamily: font.style.fontFamily,
                    width: 'max-content',
                    minWidth: '100px',
                    maxWidth: '800px',
                    minHeight: '40px',
                    padding: '12px',
                    lineHeight: '1.2'
                }}
                dangerouslySetInnerHTML={{ __html: value || "Text" }}
            />
            <ContentEditable 
                html={value || "Text"}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className={cn(
                    "h-full w-full flex items-center justify-center text-center drop-shadow-md outline-hidden",
                    font.className
                )}
                style={{
                    fontSize: `${currentFontSize}px`,
                    color: fill ? colorToCss(fill) : "#000",
                    padding: '12px',
                    lineHeight: '1.2'
                }}
            />
        </foreignObject>
    )
}