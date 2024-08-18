"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface InfoProps {
    boardId: string;
}

export const Info = ({
    boardId,
}: InfoProps) => {
    const data = useQuery(api.board.get, { id: boardId as Id<"boards"> });

    if(!data) return <InfoSkeleton />;

    return (
        <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md">
            TODO: Information about the board
        </div>
    )
}

export const InfoSkeleton = () => {
    return (
        <div
            className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]"
        />
    )
}