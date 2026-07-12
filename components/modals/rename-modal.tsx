"use client";

import { useState, SyntheticEvent } from 'react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogClose,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { useRenameModal } from '@/store/use-rename-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApiMutation } from '@/hooks/use-api-mutataion';
import { api } from '@/convex/_generated/api';

export const RenameModal = () => {
    const { mutate, pending } = useApiMutation(api.board.update);

    const {
        isOpen,
        onClose,
        initialValues,
    } = useRenameModal();

    const [title, setTitle] = useState(initialValues.title);
    const [prevTitle, setPrevTitle] = useState(initialValues.title);

    if (initialValues.title !== prevTitle) {
        setPrevTitle(initialValues.title);
        setTitle(initialValues.title);
    }

    const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        mutate({
            id: initialValues.id,
            title,
        })
        .then(() => {
            toast.success('Board renamed');
            onClose();
        })
        .catch(() => {
            toast.error('Failed to rename board');
        })

    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit baord title
                    </DialogTitle>
                    <DialogDescription>
                        Enter a new title for this board
                    </DialogDescription>
                    <form onSubmit={onSubmit} className='space-y-4'>
                        <Input
                            disabled={pending}
                            required
                            maxLength={60}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='Board title'
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type='button' variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button disabled={pending} type='submit'>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
};