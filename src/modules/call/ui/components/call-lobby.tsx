import { LogInIcon } from "lucide-react"
import {
DefaultVideoPlaceholder,
StreamVideoParticipant,
ToggleVideoPreviewButton,
ToggleAudioPreviewButton,
useCallStateHooks,
VideoPreview
} from '@stream-io/video-react-sdk'
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { generateAvatarUri } from "@/lib/avatar"
import Link from "next/link"

import "@stream-io/video-react-sdk/dist/css/styles.css"

interface Props {
   onJoin: () => void
}

const DisabledVideoPreview = () => {
   const {data: session} = authClient.useSession()
   return (
    <DefaultVideoPlaceholder  participant={
        {
            name: session?.user?.name ?? "",
            image: session?.user?.image ?? generateAvatarUri({seed: session?.user?.name ?? "", variant: 'initials'})
        } as StreamVideoParticipant
    }/>
   )
}

const AllowBrowserPermissions = () => {
    
    return (
        <p className="text-sm text-muted-foreground">Please grant your browser to access your camera and microphone</p>
    )
}

export const CallLobby = ({onJoin}: Props) => {
    const {useCameraState, useMicrophoneState} = useCallStateHooks()
    const {status: hasMicPermission} = useMicrophoneState()
    const {status: hasCamPermission} = useCameraState()

    const hasBrowserPermissions = hasMicPermission && hasCamPermission
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-radial from-sidebar-accent to-sidebar">
            <div className="flex flex-1 px-8 py-4 items-center justify-center h-full ">
                <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
                    <div className="flex flex-col gap-y-2 text-center">
                        <h6 className="text-lg font-medium">Ready to join?</h6>
                        <p className="text-sm text-muted-foreground">Set up your camera and microphone before joining</p>
                    </div>
                    <VideoPreview 
                    DisabledVideoPreview={
                        hasBrowserPermissions ? DisabledVideoPreview : AllowBrowserPermissions
                    }
                    />
                    <div className="flex gap-x-2">
                        <ToggleVideoPreviewButton/>
                        <ToggleAudioPreviewButton/>
                    </div>
                    <div className="flex gap-x-2 justify-between w-full">
                        <Button asChild variant="ghost">
                            <Link href="/meetings">
                            Cancel</Link>
                            </Button>
                        <Button onClick={onJoin}>
                            <LogInIcon/>
                            Join</Button>
                    </div>
                    
                </div>
            </div>
            
        </div>
    )
}