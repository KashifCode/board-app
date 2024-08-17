"use client";

import Image from "next/image";
import { CreateOrganization } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';

export const EmptyOrg = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <Image
                src="/elements.svg"
                alt="Empty"
                width={200}
                height={200}
            />
            <h2 className=" text-2xl font-semibold mt-6">
                Welcome to Board
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
                Create an organization to get started
            </p>
            <div className="mt-6">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg">
                            Create Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        title="Create Organization from dashboard"
                        className="p-0 bg-transparent border-none w-auto [&>*:nth-child(2)]:z-10"
                    >
                        <CreateOrganization 
                            routing="hash"
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
