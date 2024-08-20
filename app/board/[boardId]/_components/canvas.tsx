"use client";

import { useState } from "react";

import { CanvasMode, CanvasState } from "@/types/canvas";

import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { useHistory, useCanUndo, useCanRedo } from "@liveblocks/react/suspense";

interface CanvasProps {
    boardId: string;
}

export const Canvas = ({
    boardId,
}: CanvasProps) => {
    const [canvasState, setConvasState] = useState<CanvasState>({
        mode: CanvasMode.None,
    });

    const histroy = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();

    return (
        <main
            className="h-full w-full relative bg-neutral-100 touch-none"
        >
            <Info boardId={boardId} />
            <Participants />
            <Toolbar
                canvasState={canvasState}
                setConvasState={setConvasState}
                canUndo={canUndo}
                canRedo={canRedo}
                undo={histroy.undo}
                redo={histroy.redo}
            />
        </main>
    );
};