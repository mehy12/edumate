"use client"
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { CallLobby } from "./call-lobby";
import CallActive from "./call-active";
import { CallEnd } from "./call-end";

interface Props {
    meetingId: string;
    meetingName: string;
}

export function CallUI({ meetingId, meetingName }: Props) {
    const call = useCall();
    const router = useRouter();
    const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

    const handleJoin = async () => {
        if (!call) return;
        await call.join();
        setShow("call");
    };

    const handleLeave = async () => {
        if (!call) return;
        try {
            // Check if the call is still active before trying to leave
            if (call.state.callingState !== "left") {
                await call.leave();
            }
        } catch (error) {
            console.error("Error leaving call:", error);
        } finally {
            setShow("ended");
            // Redirect user to the session summary page for this meeting
            router.push(`/meetings/${meetingId}/summary`);
        }
    };

    return (
        <StreamTheme className="h-full w-full">
            {show === "lobby" && <CallLobby onJoin={handleJoin} />}
            {show === "call" && (
                <CallActive meetingName={meetingName} onLeave={handleLeave} />
            )}
            {show === "ended" && <CallEnd meetingId={meetingId} />}
        </StreamTheme>
    );
}
