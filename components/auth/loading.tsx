import Image from "next/image";

export const Loading = () => {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <Image 
                src="/logo.svg"
                alt="Logo"
                width={120}
                height={94}
                className="animate-pulse duration-700"
                loading="eager"
            />
        </div>
    )
}