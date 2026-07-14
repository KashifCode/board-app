import { useMutation, useSelf, useRoom } from "@liveblocks/react/suspense";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LayerType, ImageLayer } from "@/types/canvas";
import { LiveObject } from "@liveblocks/client";

export const useDeleteLayers = () => {
    const selection = useSelf((me) => me.presence.selection);
    const room = useRoom();
    const scheduleImageCleanup = useConvexMutation(api.image.scheduleImageCleanup);

    return useMutation((
        { storage, setMyPresence },
    ) => {
        const liveLayers = storage.get("layers");
        const liveLayerIds = storage.get("layerIds");

        for (const id of selection) {
            const layer = liveLayers.get(id);
            if (layer) {
                if (layer.get("type") === LayerType.Image) {
                    const imageLayer = layer as LiveObject<ImageLayer>;
                    const src = imageLayer.get("src") as string | undefined;
                    if (src) {
                        scheduleImageCleanup({ roomId: room.id, src }).catch(console.error);
                    }
                }
            }

            liveLayers.delete(id);

            const index = liveLayerIds.indexOf(id);

            if (index != -1) {
                liveLayerIds.delete(index);
            }
        }

        setMyPresence({ selection: [] }, { addToHistory: true });
    }, [
        selection,
        room.id,
        scheduleImageCleanup
    ]);
};