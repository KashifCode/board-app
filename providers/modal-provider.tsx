"use client";

import { useIsClient } from "usehooks-ts";

import { RenameModal } from "@/components/modals/rename-modal";

export const ModalProvider = () => {
    const isClient = useIsClient();

    if(!isClient) {
        return null;
    }

    return (
        <>
            <RenameModal />
        </>
    );
};