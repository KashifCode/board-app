"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { nanoid } from 'nanoid';
import { LiveObject } from "@liveblocks/client";

import {
    Camera,
    CanvasMode,
    CanvasState,
    Color,
    LayerType,
    Point,
    Side,
    XYWH,
    PathLayer,
    Layer,
    ImageLayer,
} from "@/types/canvas";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";

import { cn, colorToCss, connectionIdToColor, findIntersectingLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds, distToSegment, distBetweenSegments } from "@/lib/utils";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import {
    useHistory,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStorage,
    useOthersMapped,
    useSelf,
    useMyPresence,
} from "@liveblocks/react/suspense";
import { CursorsPresence } from "./cursors-presence";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";

const MAX_LAYERS = 10000;
const SELECTON_NET_THRESHOLD = 5;

interface CanvasProps {
    boardId: string;
}

export const Canvas = ({
    boardId,
}: CanvasProps) => {
    const layerIds = useStorage((root) => root.layerIds);

    const pencilDraft = useSelf((me) => me.presence.pencilDraft);
    const selectedLayerId = useSelf((me) => me.presence.selection[0]);
    const selectedLayer = useStorage((root) => selectedLayerId ? root.layers[selectedLayerId] : undefined);
    
    const [myPresence, updateMyPresence] = useMyPresence();
    
    const [canvasState, setCanvasState] = useState<CanvasState>({
        mode: CanvasMode.None,
    });
    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
    const [lastUsedColor, setLastUsedColor] = useState<Color>({
        r: 0,
        g: 0,
        b: 0,
    });
    const [eraserSize, setEraserSize] = useState<number>(20);

    const zoomToPoint = useCallback((zoomAmount: number, clientX: number, clientY: number) => {
        setCamera((camera) => {
            const zoom = camera.zoom || 1;
            const newZoom = Math.min(Math.max(zoom + zoomAmount, 0.1), 5);
            
            const canvasX = (clientX - camera.x) / zoom;
            const canvasY = (clientY - camera.y) / zoom;
            
            return {
                x: clientX - canvasX * newZoom,
                y: clientY - canvasY * newZoom,
                zoom: newZoom,
            };
        });
    }, []);

    const zoomIn = useCallback(() => {
        zoomToPoint(0.1, window.innerWidth / 2, window.innerHeight / 2);
    }, [zoomToPoint]);

    const zoomOut = useCallback(() => {
        zoomToPoint(-0.1, window.innerWidth / 2, window.innerHeight / 2);
    }, [zoomToPoint]);

    useDisableScrollBounce();
    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();

    const insertLayer = useMutation((
        { storage, setMyPresence },
        layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note,
        bounds: XYWH,
    ) => {
        const liveLayers = storage.get("layers");
        if (liveLayers.size >= MAX_LAYERS) {
            return;
        }

        const livelayerIds = storage.get("layerIds");
        const layerId = nanoid();
        const layer = new LiveObject({
            type: layerType,
            x: bounds.x,
            y: bounds.y,
            height: bounds.height,
            width: bounds.width,
            fill: lastUsedColor,
        });

        livelayerIds.push(layerId);
        liveLayers.set(layerId, layer);

        setMyPresence({ selection: [layerId] }, { addToHistory: true });
        
        return layerId;
    }, [lastUsedColor]);

    const insertImageLayer = useMutation((
        { storage, setMyPresence },
        src: string,
        bounds: XYWH,
    ) => {
        const liveLayers = storage.get("layers");
        if (liveLayers.size >= MAX_LAYERS) {
            return;
        }

        const livelayerIds = storage.get("layerIds");
        const layerId = nanoid();
        const layer = new LiveObject<Layer>({
            type: LayerType.Image,
            x: bounds.x,
            y: bounds.y,
            height: bounds.height,
            width: bounds.width,
            fill: { r: 0, g: 0, b: 0 },
            src: src,
        });

        livelayerIds.push(layerId);
        liveLayers.set(layerId, layer);

        setMyPresence({ selection: [layerId] }, { addToHistory: true });
        
        return layerId;
    }, []);

    const translateSelectedLayers = useMutation((
        { storage, self },
        point: Point,
    ) => {
        if (canvasState.mode !== CanvasMode.Translating) {
            return;
        }

        const offset = {
            x: point.x - canvasState.current.x,
            y: point.y - canvasState.current.y,
        }

        const liveLayers = storage.get("layers");

        for (const id of self.presence.selection) {
            const layer = liveLayers.get(id);
            if (layer) {
                layer.update({
                    x: layer.get("x") + offset.x,
                    y: layer.get("y") + offset.y,
                });
            }
        }

        setCanvasState({ mode: CanvasMode.Translating, current: point });
    }, [
        canvasState,
    ]);

    const unselectLayers = useMutation((
        { self, setMyPresence },
    ) => {
        if (self.presence.selection.length >= 0) {
            setMyPresence({ selection: [] }, { addToHistory: true });
        }
    }, []);

    const abortCurrentAction = useMutation((
        { setMyPresence }
    ) => {
        setMyPresence({ pencilDraft: null });
        setCanvasState((current) => {
            if (current.mode === CanvasMode.Pressing || current.mode === CanvasMode.SelectionNet || current.mode === CanvasMode.Translating || current.mode === CanvasMode.Resizing) {
                return { mode: CanvasMode.None };
            }
            return current;
        });
    }, [setCanvasState]);

    const updateSelectionNet = useMutation((
        { storage, setMyPresence },
        current: Point,
        origin: Point,
    ) => {
        const layers = storage.get("layers");
        setCanvasState({
            mode: CanvasMode.SelectionNet,
            origin,
            current,
        });

        const ids = findIntersectingLayersWithRectangle(
            layerIds,
            new Map(Object.entries(layers.toJSON())) as ReadonlyMap<string, Layer>,
            origin,
            current,
        );

        setMyPresence({ selection: ids })
    }, [layerIds]);

    const startMultiSelection = useCallback((
        current: Point,
        origin: Point,
    ) => {
        if (
            (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y)) > SELECTON_NET_THRESHOLD
        ) {
            setCanvasState({
                mode: CanvasMode.SelectionNet,
                origin,
                current,
            })
        }
    }, []);

    const activeEraserSession = useRef<Set<string>>(new Set());

    // Move isPathLayer OUTSIDE so it can be reused
    const isPathLayer = (layer: LiveObject<Layer>): layer is LiveObject<PathLayer> => {
        return layer.get("type") === LayerType.Path;
    };

    const eraseRadius = useMutation((
        { storage },
        current: Point,
        prevCurrent?: Point,
    ) => {
        const liveLayers = storage.get("layers");
        const liveLayerIds = storage.get("layerIds");

        const currentLayerIds: string[] = [];
        for (let i = 0; i < liveLayerIds.length; i++) {
            const id = liveLayerIds.get(i);
            if (id) currentLayerIds.push(id);
        }

        for (const layerId of currentLayerIds) {
            const layer = liveLayers.get(layerId);
            if (!layer) continue;

            const type = layer.get("type");
            const x = layer.get("x");
            const y = layer.get("y");

            const e1 = prevCurrent || current;
            const e2 = current;
            const width = layer.get("width");
            const height = layer.get("height");

            // Bounding box filter for ALL layers (including paths) to fix lag!
            const closestX = Math.max(x as number, Math.min(current.x, (x as number) + (width as number)));
            const closestY = Math.max(y as number, Math.min(current.y, (y as number) + (height as number)));
            if (distToSegment({ x: closestX, y: closestY }, e1, e2) > eraserSize) {
                continue;
            }

            if (isPathLayer(layer)) {
                const points = layer.get("points");
                if (!points || points.length === 0) continue;

                let isIntersecting = false;
                for (let i = 0; i < points.length; i++) {
                    const p = points[i];
                    const pXy = { x: p[0] + (x as number), y: p[1] + (y as number) };

                    if (i === 0) {
                        if (distToSegment(pXy, e1, e2) <= eraserSize) {
                            isIntersecting = true;
                            break;
                        }
                    } else {
                        const prevP = points[i - 1];
                        const prevPxy = { x: prevP[0] + (x as number), y: prevP[1] + (y as number) };
                        if (distBetweenSegments(prevPxy, pXy, e1, e2) <= eraserSize) {
                            isIntersecting = true;
                            break;
                        }
                    }
                }

                if (isIntersecting) {
                    if (!activeEraserSession.current.has(layerId)) {
                        activeEraserSession.current.add(layerId);
                        setCanvasState(prev => prev.mode === CanvasMode.Eraser ? {
                            ...prev, 
                            erasedLayerIds: [...(prev.erasedLayerIds || []), layerId]
                        } : prev);
                    }
                }
            } else switch (type) {
                case LayerType.Rectangle:
                case LayerType.Ellipse:
                case LayerType.Text:
                case LayerType.Note: {
                    // We already checked the bounding box at the top of the loop!
                    // If we get here, it intersects!
                    liveLayers.delete(layerId);
                    const index = liveLayerIds.indexOf(layerId);
                    if (index !== -1) liveLayerIds.delete(index);
                    break;
                }}
        }
    }, [setCanvasState, eraserSize]);

    const insertEraserStrokes = useMutation((
        { storage, self, setMyPresence }
    ) => {
        const draft = self.presence.eraserDraft;
        if (!draft || activeEraserSession.current.size === 0) return;
        
        const liveLayers = storage.get("layers");
        
        for (const layerId of activeEraserSession.current) {
            const layer = liveLayers.get(layerId);
            if (layer && isPathLayer(layer)) {
                const eraserStrokes = layer.get("eraserStrokes") || [];
                const localDraftStrokes = draft.map(p => [p[0] - (layer.get("x") as number), p[1] - (layer.get("y") as number)]);
                layer.update({ eraserStrokes: [...eraserStrokes, { points: localDraftStrokes, size: eraserSize }] });
            }
        }
        activeEraserSession.current.clear();
        setMyPresence({ eraserDraft: null });
        setCanvasState(prev => prev.mode === CanvasMode.Eraser ? { ...prev, erasedLayerIds: [] } : prev);
    }, [eraserSize]);

    const continueDrawing = useMutation((
        { self, setMyPresence },
        point: Point,
        e: React.PointerEvent,
    ) => {
        const { pencilDraft } = self.presence;

        if (
            canvasState.mode !== CanvasMode.Pencil ||
            pencilDraft == null
        ) {
            return;
        }

        setMyPresence({
            cursor: point,
            pencilDraft:
                pencilDraft.length === 1 &&
                    pencilDraft[0][0] === point.x &&
                    pencilDraft[0][1] === point.y
                    ? pencilDraft
                    : [...pencilDraft, [point.x, point.y, e.pressure]],
        });
    }, [canvasState.mode]);

    const insertPath = useMutation((
        { storage, self, setMyPresence },
    ) => {
        const liveLayers = storage.get("layers");
        const { pencilDraft } = self.presence;

        if (
            pencilDraft == null ||
            pencilDraft.length < 2 ||
            liveLayers.size >= MAX_LAYERS
        ) {
            setMyPresence({ pencilDraft: null });
            return;
        }

        const id = nanoid();
        liveLayers.set(
            id,
            new LiveObject(penPointsToPathLayer(
                pencilDraft,
                lastUsedColor,
            )),
        );

        const liveLayerIds = storage.get("layerIds");
        liveLayerIds.push(id);

        setMyPresence({ pencilDraft: null });
        setCanvasState({ mode: CanvasMode.Pencil });
    }, [lastUsedColor]);

    const startDrawing = useMutation((
        { setMyPresence },
        point: Point,
        pressure: number,
    ) => {
        setMyPresence({
            pencilDraft: [[point.x, point.y, pressure]],
            penColor: lastUsedColor,
        })
    }, [lastUsedColor]);

    const resizeSelectedLayer = useMutation((
        { storage, self },
        point: Point,
    ) => {
        if (canvasState.mode !== CanvasMode.Resizing) {
            return;
        }

        const bounds = resizeBounds(
            canvasState.initialBounds,
            canvasState.corner,
            point,
        )

        const liveLayers = storage.get("layers");
        const layer = liveLayers.get(self.presence.selection[0]);

        if (layer) {
            layer.update(bounds);
        };


    }, [canvasState]);

    const onResizeHandlePointerDown = useCallback((
        corner: Side,
        initialBounds: XYWH,
    ) => {
        history.pause();
        setCanvasState({
            mode: CanvasMode.Resizing,
            initialBounds,
            corner,
        })
    }, [history]);

    const onWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            const zoomAmount = -e.deltaY * 0.005;
            zoomToPoint(zoomAmount, e.clientX, e.clientY);
        } else {
            setCamera((camera) => ({
                ...camera,
                x: camera.x - e.deltaX,
                y: camera.y - e.deltaY,
            }));
        }
    }, [zoomToPoint]);

    const touchPinchData = useRef<{ 
        initialDist: number, 
        initialZoom: number, 
        initialCameraX: number,
        initialCameraY: number,
        initialCenter: Point 
    } | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            abortCurrentAction();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const center = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            
            setCamera((camera) => {
                touchPinchData.current = { 
                    initialDist: dist, 
                    initialZoom: camera.zoom || 1, 
                    initialCameraX: camera.x,
                    initialCameraY: camera.y,
                    initialCenter: center 
                };
                return camera;
            });
        } else {
            touchPinchData.current = null;
        }
    }, [abortCurrentAction]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchPinchData.current) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const currentCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };

            const data = touchPinchData.current;
            
            const scaleAmount = currentDist / data.initialDist;
            const newZoom = Math.min(Math.max(data.initialZoom * scaleAmount, 0.1), 5);
            
            const canvasX = (data.initialCenter.x - data.initialCameraX) / data.initialZoom;
            const canvasY = (data.initialCenter.y - data.initialCameraY) / data.initialZoom;
            
            const newCameraX = currentCenter.x - canvasX * newZoom;
            const newCameraY = currentCenter.y - canvasY * newZoom;

            setCamera({
                x: newCameraX,
                y: newCameraY,
                zoom: newZoom,
            });
        }
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        touchPinchData.current = null;
    }, []);

    const onPointerMove = useMutation((
        { setMyPresence, self },
        e: React.PointerEvent
    ) => {
        e.preventDefault();

        if (!e.isPrimary) return;

        if ((canvasState.mode === CanvasMode.Hand && e.buttons === 1) || e.buttons === 2 || e.buttons === 4) {
            setCamera((camera) => ({
                ...camera,
                x: camera.x + e.movementX,
                y: camera.y + e.movementY,
            }));
            return;
        }

        const current = pointerEventToCanvasPoint(e, camera);

        if (canvasState.mode === CanvasMode.Pressing) {
            startMultiSelection(current, canvasState.origin);
        } else if (canvasState.mode === CanvasMode.SelectionNet) {
            updateSelectionNet(current, canvasState.origin);
        } else if (canvasState.mode === CanvasMode.Translating) {
            translateSelectedLayers(current);
        } else if (canvasState.mode === CanvasMode.Resizing) {
            resizeSelectedLayer(current);
        } else if (canvasState.mode === CanvasMode.Pencil) {
            continueDrawing(current, e);
        } else if (canvasState.mode === CanvasMode.Inserting) {
            if (canvasState.origin) {
                setCanvasState({
                    mode: CanvasMode.Inserting,
                    layerType: canvasState.layerType,
                    origin: canvasState.origin,
                    current,
                });
            }
        } else if (canvasState.mode === CanvasMode.Eraser) {
            setCanvasState((prev) => ({ ...prev, current }));
            if (e.buttons === 1) {
                setMyPresence({
                    cursor: current,
                    eraserDraft: self.presence.eraserDraft ? [...self.presence.eraserDraft, [current.x, current.y]] : [[current.x, current.y]]
                });
                eraseRadius(current, canvasState.current);
            }
        }

        setMyPresence({ cursor: current });
    }, [
        continueDrawing,
        camera,
        canvasState,
        resizeSelectedLayer,
        translateSelectedLayers,
        startMultiSelection,
        updateSelectionNet,
    ]);

    const onPointerLeave = useMutation(({ setMyPresence }) => {
        setMyPresence({ cursor: null });
    }, []);

    const onPointerDown = useCallback((
        e: React.PointerEvent,
    ) => {
        if (!e.isPrimary) return;
        
        if (e.button === 2) {
            rightClickStart.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (e.button === 1) {
            return;
        }

        if (canvasState.mode === CanvasMode.Hand) {
            return;
        }

        const point = pointerEventToCanvasPoint(e, camera);
        
        if (canvasState.mode === CanvasMode.Eraser) {
            activeEraserSession.current.clear();
            setCanvasState(prev => ({ ...prev, current: point, erasedLayerIds: [] }));
            updateMyPresence({ eraserDraft: [[point.x, point.y]] });
            eraseRadius(point);
            return;
        }

        if (canvasState.mode === CanvasMode.Inserting) {
            setCanvasState({
                mode: CanvasMode.Inserting,
                layerType: canvasState.layerType,
                origin: point,
                current: point,
            });
            return;
        }

        if (canvasState.mode === CanvasMode.Pencil) {
            startDrawing(point, e.pressure);
            return;
        }

        setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    }, [
        camera,
        canvasState.mode,
        setCanvasState,
        startDrawing,
    ])

    const onPointerUp = useMutation((
        { },
        e
    ) => {
        if (!e.isPrimary) return;
        
        if (e.button === 2 || e.button === 1) {
            return;
        }

        const point = pointerEventToCanvasPoint(e, camera);

        if (
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Pressing
        ) {
            unselectLayers();

            setCanvasState({
                mode: CanvasMode.None,
            })
        } else if (canvasState.mode === CanvasMode.Pencil) {
            insertPath();
        } else if (canvasState.mode === CanvasMode.Inserting) {
            if (canvasState.origin && canvasState.current) {
                const origin = canvasState.origin;
                const current = canvasState.current;
                
                const width = Math.abs(current.x - origin.x);
                const height = Math.abs(current.y - origin.y);
                const x = Math.min(origin.x, current.x);
                const y = Math.min(origin.y, current.y);
                
                if (width < 10 && height < 10) {
                    insertLayer(canvasState.layerType, { x: origin.x, y: origin.y, width: 100, height: 100 });
                } else {
                    insertLayer(canvasState.layerType, { x, y, width, height });
                }
            } else {
                insertLayer(canvasState.layerType, { x: point.x, y: point.y, width: 100, height: 100 });
            }
            
            setCanvasState({
                mode: CanvasMode.None,
            });
        } else if (canvasState.mode === CanvasMode.Eraser) {
            insertEraserStrokes();
        } else {
            setCanvasState({
                mode: canvasState.mode === CanvasMode.Hand ? CanvasMode.Hand : CanvasMode.None,
            });
        }

        history.resume();
    }, [
        setCanvasState,
        camera,
        canvasState,
        history,
        insertLayer,
        unselectLayers,
        insertPath
    ]);

    const selections = useOthersMapped((other) => other.presence.selection);

    const onLayerPointerDown = useMutation((
        { self, setMyPresence, storage },
        e: React.PointerEvent,
        layerId: string,
    ) => {
        if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting) {
            return;
        }

        if (canvasState.mode === CanvasMode.Eraser) {
            return;
        }

        history.pause();
        e.stopPropagation();

        const point = pointerEventToCanvasPoint(e, camera);

        if (!self.presence.selection.includes(layerId)) {
            setMyPresence({ selection: [layerId] }, { addToHistory: true });
        }
        setCanvasState({ mode: CanvasMode.Translating, current: point });
    }, [
        setCanvasState,
        camera,
        history,
        canvasState.mode,
    ]);

    const layerIdsToColorSelection = useMemo(() => {
        const layerIdsToColorSelection: Record<string, string> = {};

        for (const user of selections) {
            const [connectionId, selection] = user;

            for (const layerId of selection) {
                layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
            }
        }

        return layerIdsToColorSelection;
    }, [selections]);

    const deleteLayers = useDeleteLayers();

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            switch (e.key) {
                case "Backspace":
                case "Delete": {
                    if(selectedLayer?.type === LayerType.Note || selectedLayer?.type === LayerType.Text) {
                        break;
                    }
                    deleteLayers();
                    break;
                }
                case "z": {
                    if (e.ctrlKey || e.metaKey) {
                        history.undo();
                        break;
                    }
                }
                case "y": {
                    if (e.ctrlKey || e.metaKey) {
                        history.redo();
                        break;
                    }
                }
            }
        }

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        }
    }, [deleteLayers, history, selectedLayer]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastRightClick = useRef<Point>({ x: 0, y: 0 });
    const rightClickStart = useRef<Point | null>(null);

    const { startUpload } = useUploadThing("imageUploader", {
        onClientUploadComplete: (res) => {
            if (res && res[0]) {
                insertImageLayer(res[0].url, {
                    x: lastRightClick.current.x,
                    y: lastRightClick.current.y,
                    width: 300,
                    height: 300,
                });
            }
        },
        onUploadError: (error) => {
            toast.error(`Upload failed: ${error.message}`);
        },
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.info("Uploading image...");
        await startUpload([file]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <main
            className="h-full w-full relative bg-neutral-100 touch-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: "none" }} 
            />
            <Info boardId={boardId} />
            <Participants />
            <Toolbar
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                canUndo={canUndo}
                canRedo={canRedo}
                undo={history.undo}
                redo={history.redo}
                unSelectLayers={unselectLayers}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
            />
            {canvasState.mode === CanvasMode.Eraser && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl p-2 flex items-center gap-x-2 shadow-sm border border-neutral-200 z-50">
                    {[10, 20, 30, 40].map((size) => (
                        <button
                            key={size}
                            onClick={() => setEraserSize(size)}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg hover:bg-neutral-100 transition",
                                eraserSize === size && "bg-neutral-100"
                            )}
                        >
                            <div 
                                className="bg-neutral-800 rounded-full" 
                                style={{ width: size, height: size }}
                            />
                        </button>
                    ))}
                </div>
            )}
            <SelectionTools
                camera={camera}
                setLastUsedColor={setLastUsedColor}
            />
            <ContextMenu>
            <ContextMenuTrigger asChild>
            <svg
                className={cn(
                    "h-screen w-screen touch-none",
                    canvasState.mode === CanvasMode.Hand ? "cursor-grab active:cursor-grabbing" : ""
                )}
                onContextMenu={(e) => {
                    if (rightClickStart.current) {
                        const dist = Math.abs(e.clientX - rightClickStart.current.x) + Math.abs(e.clientY - rightClickStart.current.y);
                        if (dist > 5) {
                            e.preventDefault();
                            return;
                        }
                    }
                    lastRightClick.current = pointerEventToCanvasPoint(e, camera);
                }}
                onWheel={onWheel}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                onPointerUp={onPointerUp}
                onPointerDown={onPointerDown}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
            >
                <g
                    style={{
                        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom || 1})`,
                    }}
                >
                    {layerIds.map((layerId) => (
                        <LayerPreview
                            key={layerId}
                            id={layerId}
                            onLayerPointerDown={onLayerPointerDown}
                            selectionColor={layerIdsToColorSelection[layerId]}
                            isErasing={canvasState.mode === CanvasMode.Eraser && canvasState.erasedLayerIds?.includes(layerId)}
                            eraserSize={eraserSize}
                        />
                    ))}
                    <SelectionBox
                        onResizeHandlePointerDown={onResizeHandlePointerDown}
                    />
                    {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
                        <rect
                            className="fill-blue-500/5 stroke-blue-500 stroke-1"
                            x={Math.min(canvasState.origin.x, canvasState.current.x)}
                            y={Math.min(canvasState.origin.y, canvasState.current.y)}
                            width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                            height={Math.abs(canvasState.origin.y - canvasState.current.y)}
                        />
                    )}
                    {canvasState.mode === CanvasMode.Inserting && canvasState.origin != null && canvasState.current != null && (
                        canvasState.layerType === LayerType.Ellipse ? (
                            <ellipse
                                className="fill-transparent stroke-blue-500 stroke-2"
                                strokeDasharray="4 4"
                                cx={Math.min(canvasState.origin.x, canvasState.current.x) + Math.abs(canvasState.origin.x - canvasState.current.x) / 2}
                                cy={Math.min(canvasState.origin.y, canvasState.current.y) + Math.abs(canvasState.origin.y - canvasState.current.y) / 2}
                                rx={Math.abs(canvasState.origin.x - canvasState.current.x) / 2}
                                ry={Math.abs(canvasState.origin.y - canvasState.current.y) / 2}
                            />
                        ) : (
                            <rect
                                className="fill-transparent stroke-blue-500 stroke-2"
                                strokeDasharray="4 4"
                                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
                            />
                        )
                    )}
                    <CursorsPresence />
                    {pencilDraft != null && pencilDraft.length > 0 && (
                        <Path
                            points={pencilDraft}
                            fill={colorToCss(lastUsedColor)}
                            x={0}
                            y={0}

                        />
                    )}
                    {canvasState.mode === CanvasMode.Eraser && canvasState.current != null && (
                        <circle
                            cx={canvasState.current.x}
                            cy={canvasState.current.y}
                            r={eraserSize}
                            className="fill-red-500/20 stroke-red-500 stroke-2 pointer-events-none"
                        />
                    )}
                </g>
            </svg>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                </ContextMenuItem>
            </ContextMenuContent>
            </ContextMenu>
        </main>
    );
};