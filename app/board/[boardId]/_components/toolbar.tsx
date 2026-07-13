import { Circle, Hand, MousePointer2, Pencil, Redo2, Square, StickyNote, Type, Undo2, ZoomIn, ZoomOut } from "lucide-react";

import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";

import { ToolButton } from "./tool-button";

interface ToolbarProps {
    canvasState: CanvasState;
    setCanvasState: (newState: CanvasState) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    unSelectLayers: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
};

export const Toolbar = ({
    canvasState,
    setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
    unSelectLayers,
    zoomIn,
    zoomOut,
}: ToolbarProps) => {
    return (
        <>
            <div className="absolute md:top-[50%] md:translate-y-[-50%] md:left-2 bottom-2 left-1/2 -translate-x-1/2 md:translate-x-0 flex md:flex-col flex-row gap-2 md:gap-y-4 max-h-[calc(100%-120px)] md:max-h-[calc(100%-30px)] max-w-[calc(100%-32px)] overflow-x-auto md:overflow-visible overflow-y-hidden z-50 pb-1 pr-1 pl-1 pt-1">
                <div className="bg-white rounded-md p-1.5 flex md:flex-col flex-row gap-1 items-center shadow-md shrink-0">
                    <ToolButton
                        label="Select"
                        icon={MousePointer2}
                        onClick={() => setCanvasState({ mode: CanvasMode.None })}
                        isActive={
                            canvasState.mode === CanvasMode.None ||
                            canvasState.mode === CanvasMode.Translating ||
                            canvasState.mode === CanvasMode.SelectionNet ||
                            canvasState.mode === CanvasMode.Pressing ||
                            canvasState.mode === CanvasMode.Resizing
                        }
                    />
                    <ToolButton
                        label="Hand"
                        icon={Hand}
                        onClick={() => {
                            setCanvasState({ mode: CanvasMode.Hand });
                            unSelectLayers();
                        }}
                        isActive={
                            canvasState.mode === CanvasMode.Hand
                        }
                    />
                    <ToolButton
                        label="Text"
                        icon={Type}
                        onClick={() => {
                            setCanvasState({
                                mode: CanvasMode.Inserting,
                                layerType: LayerType.Text,
                            });
                            unSelectLayers();
                        }}
                        isActive={
                            canvasState.mode === CanvasMode.Inserting &&
                            canvasState.layerType === LayerType.Text
                        }
                    />
                    <ToolButton
                        label="Sticky Note"
                        icon={StickyNote}
                        onClick={() => {
                            setCanvasState({
                                mode: CanvasMode.Inserting,
                                layerType: LayerType.Note,
                            });
                            unSelectLayers();
                        }}
                        isActive={
                            canvasState.mode === CanvasMode.Inserting &&
                            canvasState.layerType === LayerType.Note
                        }
                    />
                    <ToolButton
                        label="Rectangle"
                        icon={Square}
                        onClick={() => {
                            setCanvasState({
                                mode: CanvasMode.Inserting,
                                layerType: LayerType.Rectangle,
                            });
                            unSelectLayers();
                        }}
                        isActive={
                            canvasState.mode === CanvasMode.Inserting &&
                            canvasState.layerType === LayerType.Rectangle
                        }
                    />
                    <ToolButton
                        label="Ellipse"
                        icon={Circle}
                        onClick={() => {
                            setCanvasState({
                                mode: CanvasMode.Inserting,
                                layerType: LayerType.Ellipse,
                            });
                            unSelectLayers();
                        }}
                        isActive={
                            canvasState.mode === CanvasMode.Inserting &&
                            canvasState.layerType === LayerType.Ellipse
                        }
                    />
                    <ToolButton
                        label="Pen"
                        icon={Pencil}
                        onClick={() => {
                            setCanvasState({
                                mode: CanvasMode.Pencil,
                            });
                            unSelectLayers();
                        }}
                        isActive={
                            canvasState.mode === CanvasMode.Pencil
                        }
                    />
                </div>
                <div className="bg-white rounded-md p-1.5 flex md:flex-col flex-row gap-1 items-center shadow-md shrink-0 md:hidden">
                    <ToolButton
                        label="Undo"
                        icon={Undo2}
                        onClick={undo}
                        isDisabled={!canUndo}
                    />
                    <ToolButton
                        label="Redo"
                        icon={Redo2}
                        onClick={redo}
                        isDisabled={!canRedo}
                    />
                </div>
                <div className="bg-white rounded-md p-1.5 flex md:flex-col flex-row gap-1 items-center shadow-md shrink-0 md:hidden">
                    <ToolButton
                        label="Zoom In"
                        icon={ZoomIn}
                        onClick={zoomIn}
                    />
                    <ToolButton
                        label="Zoom Out"
                        icon={ZoomOut}
                        onClick={zoomOut}
                    />
                </div>
            </div>

            <div className="absolute md:top-[50%] md:translate-y-[-50%] md:right-2 md:left-auto md:bottom-auto bottom-19 left-1/2 -translate-x-1/2 md:translate-x-0 hidden md:flex md:flex-col flex-row gap-2 md:gap-y-4 max-h-[calc(100%-120px)] md:max-h-[calc(100%-30px)] max-w-[calc(100%-32px)] overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden z-50 pb-1 pr-1 pl-1 pt-1">
                <div className="bg-white rounded-md p-1.5 flex md:flex-col flex-row gap-1 items-center shadow-md shrink-0">
                    <ToolButton
                        label="Undo"
                        icon={Undo2}
                        onClick={undo}
                        isDisabled={!canUndo}
                    />
                    <ToolButton
                        label="Redo"
                        icon={Redo2}
                        onClick={redo}
                        isDisabled={!canRedo}
                    />
                </div>
                <div className="bg-white rounded-md p-1.5 flex md:flex-col flex-row gap-1 items-center shadow-md shrink-0">
                    <ToolButton
                        label="Zoom In"
                        icon={ZoomIn}
                        onClick={zoomIn}
                    />
                    <ToolButton
                        label="Zoom Out"
                        icon={ZoomOut}
                        onClick={zoomOut}
                    />
                </div>
            </div>
        </>
    )
}

export const ToolbarSkeleton = () => {
    return (
        <>
            <div className="absolute md:top-[50%] md:translate-y-[-50%] md:left-2 bottom-2 left-1/2 -translate-x-1/2 md:translate-x-0 flex md:flex-col flex-row gap-2 md:gap-y-4 max-h-[calc(100%-120px)] md:max-h-[calc(100%-30px)] max-w-[calc(100%-32px)] overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden z-50">
                <div className="bg-white h-13 w-90 md:h-90 md:w-13 shadow-md rounded-md" />
                <div className="bg-white h-13 w-24 shadow-md rounded-md md:hidden" />
                <div className="bg-white h-13 w-24 shadow-md rounded-md md:hidden" />
            </div>
            <div className="absolute md:top-[50%] md:translate-y-[-50%] md:right-2 md:left-auto md:bottom-auto bottom-19 left-1/2 -translate-x-1/2 md:translate-x-0 hidden md:flex md:flex-col flex-row gap-2 md:gap-y-4 max-h-[calc(100%-120px)] md:max-h-[calc(100%-30px)] max-w-[calc(100%-32px)] overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden z-50">
                <div className="bg-white h-13 w-90 md:h-25 md:w-13 shadow-md rounded-md" />
                <div className="bg-white h-13 w-90 md:h-25 md:w-13 shadow-md rounded-md" />
            </div>
        </>
    );
};