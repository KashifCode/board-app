import { currentUser, auth } from '@clerk/nextjs/server';
import { Liveblocks } from '@liveblocks/node';
import { ConvexHttpClient } from 'convex/browser';

import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL!
);

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
    try {
        const authorization = await auth();
        const user = await currentUser();

        if (!authorization || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { room } = await request.json();
        
        if (!room) {
            return new Response(JSON.stringify({ error: "Missing room" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const board = await convex.query(api.board.get, { id: room });

        if (board?.orgId !== authorization.orgId) {
            return new Response(JSON.stringify({ error: "Unauthorized access to board" }), { 
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const userInfo = {
            name: user.firstName || "Teammate",
            picture: user.imageUrl,
        };

        const session = liveblocks.prepareSession(
            user.id,
            { userInfo }
        );

        session.allow(room, ["*:write"] as any);

        const { status, body } = await session.authorize();

        return new Response(body, { status, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Liveblocks auth error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

