import { CallControls, SpeakerLayout } from "@stream-io/video-react-sdk";
import Image from "next/image";
import Link from "next/link";

interface Props {
    meetingName: string;
    onLeave: () => void;
}

export default function CallActive({ meetingName, onLeave }: Props) {
    return (
        <div className="flex h-screen w-full flex-col bg-gradient-to-br from-gray-900 via-black to-gray-800">
            {/* Header Navbar */}
            <div className="flex items-center justify-between bg-white/5 border-b border-white/10 px-4 py-3 backdrop-blur-xl shadow-lg">
                <Link 
                    href="/meetings" 
                    className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/30 shadow-lg"
                >
                    <Image src="/logo.svg" alt="logo" width={24} height={24} />
                    <h4 className="text-sm md:text-base font-medium text-white drop-shadow-sm truncate max-w-[180px] sm:max-w-[240px] md:max-w-none">
                        {meetingName}
                    </h4>
                </Link>
            </div>

            {/* Main video layout */}
            <div className="flex-1 flex items-center justify-center px-2 md:px-4">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-inner">
                    <SpeakerLayout />
                </div>
            </div>

            {/* Call controls at bottom */}
            <div className="flex justify-center pb-6 px-2 sm:px-4">
                <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl rounded-3xl bg-white/10 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
                    <CallControls onLeave={onLeave} />
                </div>
            </div>
        </div>
    );
}
