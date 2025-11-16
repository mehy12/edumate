"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";

function getColor(count: number) {
  if (!count) return "bg-muted";
  if (count < 2) return "bg-emerald-100";
  if (count < 5) return "bg-emerald-300";
  if (count < 10) return "bg-emerald-500";
  return "bg-emerald-700";
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data);
        setName(data.name ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
        setBio(data.bio ?? '');

        const ares = await fetch('/api/profile/activity?range=year');
        if (ares.ok) {
          const adata = await ares.json();
          setActivity(adata.days || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, avatarUrl, bio }) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Prepare grid weeks
  const weeks: any[] = [];
  if (activity.length) {
    // group activity by week columns (starting from earliest)
    const start = new Date(activity[0].date);
    const end = new Date(activity[activity.length - 1].date);
    // align start to Sunday
    const s = new Date(start);
    s.setUTCDate(s.getUTCDate() - s.getUTCDay());

    let cur = new Date(s);
    while (cur <= end) {
      const week: any[] = [];
      for (let i = 0; i < 7; i++) {
        const key = cur.toISOString().slice(0, 10);
        const day = activity.find((d: any) => d.date === key) || { date: key, count: 0 };
        week.push(day);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      weeks.push(week);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>View and update your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="w-16 h-16">
              {/* Avatar implementation shows fallback automatically */}
              {avatarUrl ? <img src={avatarUrl} alt={name} /> : null}
            </Avatar>
            <div className="flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio" className="mt-2" />
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Avatar URL" className="mt-2" />
              <div className="mt-3">
                <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Your consistency on eduMate over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <div className="flex gap-2 items-start">
              <div className="grid grid-flow-col gap-1" style={{ gridAutoColumns: '10px' }}>
                {weeks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No activity yet</div>
                ) : (
                  weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day: any, di: number) => (
                        <div key={di} title={`${day.count} activities on ${day.date}`} className={`w-3 h-3 rounded-sm ${getColor(day.count)}`} />
                      ))}
                    </div>
                  ))
                )}
              </div>
              <div className="ml-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">Less</div>
                <div className="flex gap-1 items-center">
                  <div className="w-3 h-3 rounded-sm bg-muted" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-100" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-700" />
                  <div className="text-sm text-muted-foreground ml-2">More</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
