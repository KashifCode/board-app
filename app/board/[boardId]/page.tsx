import { Canvas } from "./_components/canvas"
import { Loading } from "./_components/loading"
import { Room } from "./_components/room"

interface BoardIdProps {
    params: {
        boardId: string,
    }
}

const BoardIdPage = ({
    params,
}: BoardIdProps) => {
    return (
        <Room roomId={params.boardId} fallback={<Loading />}>
            <Canvas boardId={params.boardId} />
        </Room>
    )
}

export default BoardIdPage