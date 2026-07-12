import { Canvas } from "./_components/canvas"
import { Loading } from "./_components/loading"
import { Room } from "./_components/room"

interface BoardIdProps {
    params: Promise<{
        boardId: string,
    }>
}

const BoardIdPage = async ({
    params,
}: BoardIdProps) => {
    const { boardId } = await params;
    return (
        <Room roomId={boardId} fallback={<Loading />}>
            <Canvas boardId={boardId} />
        </Room>
    )
}

export default BoardIdPage