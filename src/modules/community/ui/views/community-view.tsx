"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PlusIcon, SearchIcon, SendIcon } from "lucide-react";
import { CreateChannelDialog } from "../components/create-channel-dialog";
import { UserProfileModal } from "../components/user-profile-modal";
import { format } from "date-fns";

import { authClient } from "@/lib/auth-client";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  region: string;
  createdAt: string;
  memberCount: number;
  isMember?: boolean; // new: whether current user is a member
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  userImage: string | null;
}

export function CommunityView() {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedChannelId = searchParams.get("channelId");
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch channels
  const fetchChannels = async (query?: string) => {
    try {
      setIsLoadingChannels(true);
      const url = query
        ? `/api/community/channels/search?q=${encodeURIComponent(query)}`
        : "/api/community/channels";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch channels");
      let data = await res.json();
      // If user is logged in, mark membership (assume API returns isMember or add logic here)
      if (session?.user?.id) {
        // Optionally, fetch memberships or rely on API
        // For now, assume API returns isMember
      }
      setChannels(data);
    } catch (error) {
      console.error("Error fetching channels:", error);
      toast.error("Failed to load channels");
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Fetch messages for selected channel
  const fetchMessages = async (channelId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await fetch(`/api/community/channels/${channelId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load selected channel details
  const loadSelectedChannel = async (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      setSelectedChannel(channel);
      await fetchMessages(channelId);
    } else {
      // Try to find it in all channels (might be from search)
      try {
        const res = await fetch(`/api/community/channels/search?q=`);
        if (res.ok) {
          const allChannels = await res.json();
          const found = allChannels.find((c: Channel) => c.id === channelId);
          if (found) {
            setSelectedChannel(found);
            await fetchMessages(channelId);
          }
        }
      } catch (error) {
        console.error("Error loading channel:", error);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchChannels();
  }, []);

  // Handle channel selection from URL
  useEffect(() => {
    if (selectedChannelId) {
      loadSelectedChannel(selectedChannelId);
    } else {
      setSelectedChannel(null);
      setMessages([]);
    }
  }, [selectedChannelId, channels]);

  // Poll for new messages when channel is selected
  useEffect(() => {
    if (!selectedChannelId) return;

    const interval = setInterval(() => {
      fetchMessages(selectedChannelId);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedChannelId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchChannels(query || undefined);
  };

  // Handle channel select
  const handleChannelSelect = (channel: Channel) => {
    if (channel.isMember) {
      router.push(`/community?channelId=${channel.id}`);
    }
  };

  // Handle join channel
  const handleJoinChannel = async (channel: Channel) => {
    try {
      const joinRes = await fetch(`/api/community/channels/${channel.id}/join`, {
        method: "POST",
      });
      if (!joinRes.ok) {
        const error = await joinRes.json();
        if (error.error && !error.error.includes("Already")) {
          throw new Error(error.error);
        }
      }
      // Mark as member and select
      setChannels((prev) => prev.map((c) => c.id === channel.id ? { ...c, isMember: true } : c));
      router.push(`/community?channelId=${channel.id}`);
    } catch (error) {
      console.error("Error joining channel:", error);
      toast.error("Failed to join channel");
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedChannelId || !messageContent.trim()) return;

    try {
      setIsSendingMessage(true);
      const res = await fetch(`/api/community/channels/${selectedChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setMessageContent("");
      
      // Refresh messages to get latest
      await fetchMessages(selectedChannelId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle create channel
  const handleChannelCreated = (newChannel: Channel) => {
    setChannels((prev) => [newChannel, ...prev]);
    setIsCreateDialogOpen(false);
    router.push(`/community?channelId=${newChannel.id}`);
  };
  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <div className="p-4 md:p-6 border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Community</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join channels with students in your region or search by name.
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Channel list */}
        <div className="w-full md:w-80 border-r flex flex-col bg-muted/40">
          <div className="p-4 space-y-3 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create channel
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoadingChannels ? (
                <div className="text-sm text-muted-foreground">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? "No channels found" : "No channels in your region yet"}
                </div>
              ) : (
                channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`transition-colors ${
                      selectedChannelId === channel.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold leading-snug">
                          {channel.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {channel.region}
                        </Badge>
                      </div>
                      {channel.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {channel.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{channel.memberCount} members</span>
                        {!channel.isMember ? (
                          <Button size="sm" onClick={() => handleJoinChannel(channel)}>
                            Join
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleChannelSelect(channel)}>
                            Open
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right side - Chat view */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              {/* Channel header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedChannel.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedChannel.region}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedChannel.memberCount} members
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1" ref={messagesContainerRef}>
                <div className="p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-sm text-muted-foreground">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No messages yet. Be the first to say something!
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const prevMessage = index > 0 ? messages[index - 1] : null;
                      const showUserHeader =
                        !prevMessage || prevMessage.userId !== message.userId;
                      const isCurrentUser = message.userId === currentUserId;

                      // Dummy user info for modal (replace with real fetch if needed)
                      const userInfo = {
                        name: message.userName,
                        yearOfStudy: undefined,
                        interests: undefined,
                        image: message.userImage || undefined,
                      };

                      return (
                        <div key={message.id} className="space-y-1">
                          {showUserHeader && (
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-sm font-medium ${!isCurrentUser ? 'cursor-pointer underline' : ''}`}
                                onClick={() => {
                                  if (!isCurrentUser) {
                                    setProfileUser(userInfo);
                                    setProfileModalOpen(true);
                                  }
                                }}
                              >
                                {isCurrentUser ? "You" : message.userName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.createdAt), "h:mm a")}
                              </span>
                            </div>
                          )}
                          <div className="pl-0">
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || isSendingMessage}
                    size="icon"
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Select a channel</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a channel from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateChannelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onChannelCreated={handleChannelCreated}
      />
      {profileUser && (
        <UserProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} user={profileUser} />
      )}
    </div>
  );
}

