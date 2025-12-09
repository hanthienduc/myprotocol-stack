"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@myprotocolstack/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@myprotocolstack/ui";
import { createClient } from "@myprotocolstack/database/client";
import { toast } from "sonner";

interface DeleteStackButtonProps {
  stackId: string;
  stackName: string;
}

export function DeleteStackButton({ stackId, stackName }: DeleteStackButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const handleDelete = async () => {
    const { error } = await supabase.from("stacks").delete().eq("id", stackId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Stack deleted");
    setOpen(false);

    startTransition(() => {
      router.push("/stacks");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete Stack
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Stack</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{stackName}&quot;? This action
            cannot be undone. All tracking data for this stack will also be
            deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
