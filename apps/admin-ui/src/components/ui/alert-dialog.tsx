import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function AlertDialog(props: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />
}

function AlertDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />
}

function AlertDialogPortal(props: React.ComponentProps<typeof DialogPortal>) {
  return <DialogPortal {...props} />
}

function AlertDialogContent(props: React.ComponentProps<typeof DialogContent>) {
  return <DialogContent showCloseButton={false} {...props} />
}

function AlertDialogHeader(props: React.ComponentProps<"div">) {
  return <DialogHeader {...props} />
}

function AlertDialogFooter(props: React.ComponentProps<"div">) {
  return <DialogFooter {...props} />
}

function AlertDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle {...props} />
}

function AlertDialogDescription(props: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription {...props} />
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button className={className} {...props} />
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <DialogClose asChild>
      <Button variant="outline" className={className} {...props} />
    </DialogClose>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
}
