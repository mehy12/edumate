import {ResponsiveDialog} from "@/components/responsive-dialog";
import { AgentsForm } from "./agents-form";

interface NewAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function NewAgentDialog({open, onOpenChange}: NewAgentDialogProps) {
  return (
    <ResponsiveDialog title="New agent" description="Create a new agent" open={open} onOpenChange={onOpenChange}>
      <AgentsForm 
        onSuccess={() => onOpenChange(false)}
        onCancel={()=>onOpenChange(false)}/>
    </ResponsiveDialog>
  );
}
