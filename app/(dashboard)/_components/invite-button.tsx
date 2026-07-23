import { Plus } from "lucide-react"
import { OrganizationProfile } from "@clerk/nextjs"

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from "@/components/ui/button"

export const InviteButton = () => {
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline">
                <Plus className="h-4 w-4 mr-2"/>
                Invite Members
            </Button>
        </DialogTrigger>
        <DialogContent title="Add Members" className="p-0 bg-transparent border-none max-w-[835px] lg:max-w-[880px]">
            <OrganizationProfile 
                routing="hash"
                appearance={{
                    elements: {
                        rootBox: {
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            maxHeight: "80vh",
                        },
                        cardBox: {
                            maxHeight: "80vh",
                            width: "100%",
                            display: "flex",
                        },
                        card: {
                            maxHeight: "80vh",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }
                    }
                }}
            />
        </DialogContent>
    </Dialog>
  )
}
