
import Image from "next/image";

interface EmptyStateProps {
  title?: string;
  description?: string;
  image?: string;
}
export default function EmptyState({ title, description, image = "/empty.svg" }: EmptyStateProps) {
  return (
    <div className=" flex flex-col items-center justify-center">
      <Image src={image} alt="empty" width={240} height={240} className="opacity-50" />
      <div className="flex flex-col gap-y-2 py-4 max-w-md mx-auto text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
