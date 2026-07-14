import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Liveblocks } from "@liveblocks/node";
import { UTApi } from "uploadthing/server";

export const scheduleImageCleanup = mutation({
  args: {
    roomId: v.string(),
    src: v.string(),
  },
  handler: async (ctx, args) => {
    // Schedule the cleanupAction to run 24 hours from now
    await ctx.scheduler.runAfter(24 * 60 * 60 * 1000, api.image.cleanupImageAction, {
      roomId: args.roomId,
      src: args.src,
    });
  },
});

export const cleanupImageAction = action({
  args: {
    roomId: v.string(),
    src: v.string(),
  },
  handler: async (ctx, args) => {
    if (!process.env.LIVEBLOCKS_SECRET_KEY || !process.env.UPLOADTHING_TOKEN) {
      console.error("Missing environment variables for image cleanup.");
      return;
    }

    const liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY,
    });
    const utapi = new UTApi();

    try {
      const storage = await liveblocks.getStorageDocument(args.roomId, "json");
      
      const layers = storage.layers as Record<string, { type: number; src?: string }> | undefined;
      let isOrphaned = true;

      if (layers) {
        for (const layerId in layers) {
          const layer = layers[layerId];
          // LayerType.Image is 5
          if (layer.type === 5 && layer.src === args.src) {
            isOrphaned = false;
            break;
          }
        }
      }

      if (isOrphaned) {
        console.log(`Image ${args.src} is orphaned, deleting from UploadThing.`);
        const urlParts = args.src.split("/");
        const fileKey = urlParts[urlParts.length - 1];
        if (fileKey) {
            await utapi.deleteFiles(fileKey);
        }
      } else {
        console.log(`Image ${args.src} is still in use, keeping it.`);
      }

    } catch (e) {
      console.error("Failed to cleanup image:", e);
    }
  },
});
