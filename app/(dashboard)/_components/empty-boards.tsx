"use client";

import { toast } from "sonner";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutataion";

export const EmptyBoards = () => {
    const { organization } = useOrganization();
    const { mutate, pending } = useApiMutation(api.board.create);

    const onClick = () => {
        if (!organization) return;

        mutate({
            orgId: organization.id,
            title: "untitled",
        })
        .then((id) => {
            toast.success("Board created");
            // TODO: Redirect to the board/{id}
        })
        .catch(() => {
            toast.error("Failed to create board");
        })
    }

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <Image
                src="/note.svg"
                alt="Empty"
                width={110}
                height={110}
            />
            <h2 className="text-2xl font-semibold mt-6">
                Create your first board!
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
                Start by creating a board for your organization
            </p>
            <div className="mt-6">
                <Button disabled={pending} onClick={onClick} size="lg">
                    Create Board
                </Button>
            </div>
        </div>
    )
};