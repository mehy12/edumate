import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    yearOfStudy?: string;
    interests?: string;
    image?: string;
  };
}

export function UserProfileModal({ open, onOpenChange, user }: UserProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <Avatar src={user.image} alt={user.name} className="w-16 h-16" />
          <div className="text-lg font-semibold">{user.name}</div>
          {user.yearOfStudy && (
            <Badge variant="outline">Year: {user.yearOfStudy}</Badge>
          )}
          {user.interests && (
            <div className="text-sm text-muted-foreground text-center">
              <span className="font-medium">Interests:</span> {user.interests}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
