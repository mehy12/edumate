"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EnrollPage() {
  const [topic, setTopic] = useState('');
  const [speed, setSpeed] = useState<'slow'|'normal'|'fast'>('normal');
  const [estimate, setEstimate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<Record<number,string>>({});
  const router = useRouter();
  const [scheduledClasses, setScheduledClasses] = useState<any[] | null>(null);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [startingClass, setStartingClass] = useState<Record<string, boolean>>({});
  
  async function fetchScheduledClasses() {
    setLoadingScheduled(true);
    try {
      const res = await fetch('/api/enroll/scheduled-classes');
      if (!res.ok) {
        setScheduledClasses([]);
        return;
      }
      const data = await res.json();
      setScheduledClasses(data || []);
    } catch (err) {
      console.error('Failed to fetch scheduled classes', err);
      setScheduledClasses([]);
    } finally {
      setLoadingScheduled(false);
    }
  }

  useEffect(() => {
    fetchScheduledClasses();
  }, []);

  async function getEstimate() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/enroll/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, learningSpeed: speed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Estimate failed');
      setEstimate(data.estimatedClassCount);
    } catch (err: any) {
      setMessage(err?.message ?? 'Failed to get estimate');
    } finally {
      setLoading(false);
    }
  }

  async function createEnrollment() {
    if (!topic.trim()) return setMessage('Topic is required');
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, learningSpeed: speed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Create failed');
      setEnrollmentId(data.enrollmentId);
      // fetch sessions
      const r = await fetch(`/api/enroll/${data.enrollmentId}`);
      const payload = await r.json();
      setSessions(payload.sessions || []);
      setMessage(`Enrollment created (${data.enrollmentId}). Estimated ${data.estimatedClassCount} classes.`);
      // refresh scheduled classes feed
      fetchScheduledClasses();
      // Optionally navigate to enrollment detail in future
      // router.push(`/enroll/${data.enrollmentId}`)
    } catch (err: any) {
      setMessage(err?.message ?? 'Failed to create enrollment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Enroll into a Course</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Topic</label>
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 mt-1" />
        </div>

        <div>
          <label className="block text-sm font-medium">Learning Speed</label>
          <select value={speed} onChange={(e) => setSpeed(e.target.value as any)} className="w-full rounded-md border px-3 py-2 mt-1">
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button onClick={getEstimate} disabled={loading}>Get Estimate</Button>
          <Button variant="secondary" onClick={createEnrollment} disabled={loading}>Create Enrollment</Button>
        </div>

        {estimate !== null && (
          <div className="text-sm text-muted-foreground">Estimated classes: <strong>{estimate}</strong></div>
        )}

        {enrollmentId && (
          <div>
            <h2 className="mt-6 text-lg font-medium">Schedule Classes</h2>
            <p className="text-sm text-muted-foreground">Select dates for each class below. Click dates on the calendar to assign.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Calendar
                  mode="multiple"
                  selected={Object.values(selectedDates).map((d) => new Date(d))}
                  onSelect={(selected) => {
                    // selected can be a Date | Date[] | Range
                    if (Array.isArray(selected)) {
                      const map: Record<number,string> = {};
                      // assign first N selected dates to sessions in order
                      for (let i = 0; i < sessions.length && i < selected.length; i++) {
                        map[i] = selected[i].toISOString();
                      }
                      setSelectedDates(map);
                    } else if (selected instanceof Date) {
                      // assign to the first unassigned session
                      const idx = sessions.findIndex((_,i) => !selectedDates[i]);
                      if (idx >= 0) setSelectedDates({ ...selectedDates, [idx]: selected.toISOString() });
                    }
                  }}
                />
              </div>

              <div>
                <div className="space-y-2">
                  {sessions.map((s, idx) => (
                    <div key={s.id} className="p-2 border rounded">
                      <div className="text-sm font-medium">{idx + 1}. {s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.description ?? '—'}</div>
                      <div className="text-sm mt-2">Selected date: {selectedDates[idx] ? new Date(selectedDates[idx]).toLocaleDateString() : 'Not set'}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Button onClick={async () => {
                    const dates = Object.entries(selectedDates).map(([sessionIndex, date]) => ({ sessionIndex: Number(sessionIndex), date }));
                    const res = await fetch(`/api/enroll/${enrollmentId}/schedule`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dates })
                    });
                    const data = await res.json();
                    if (!res.ok) return setMessage(data?.error || 'Failed to schedule');
                    setSessions(data.sessions || []);
                    setMessage('Scheduled classes saved.');
                    // refresh scheduled classes feed
                    fetchScheduledClasses();
                  }}>Save Schedule</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="text-sm text-foreground">{message}</div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Your Scheduled Classes</h2>
        <p className="text-sm text-muted-foreground mb-4">All your upcoming sessions in one place.</p>

        {loadingScheduled && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-md" />
            ))}
          </div>
        )}

        {!loadingScheduled && scheduledClasses && scheduledClasses.length === 0 && (
          <div className="p-6 border rounded-md">
            <div className="text-lg font-medium">You haven’t scheduled any classes yet.</div>
            <div className="text-sm text-muted-foreground">Enroll into a course above to get started.</div>
          </div>
        )}

        {!loadingScheduled && scheduledClasses && scheduledClasses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scheduledClasses.map((c) => {
              const dt = new Date(c.scheduledAt);
              const formattedDate = dt.toLocaleDateString();
              const formattedTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const status = c.status === 'past' ? 'Past' : (dt.toDateString() === new Date().toDateString() ? 'Today' : 'Upcoming');
              return (
                <Card key={c.classSessionId} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={async () => {
                  if (startingClass[c.classSessionId]) return;
                  setStartingClass({ ...startingClass, [c.classSessionId]: true });
                  try {
                    const res = await fetch(`/api/classes/${c.classSessionId}/start`, { method: 'POST' });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || 'Failed to start class');
                    // Redirect to call page
                    window.location.href = data.join_url;
                  } catch (err: any) {
                    console.error('Start class error', err);
                    setMessage(err?.message || 'Could not start the class. Please try again.');
                    setStartingClass({ ...startingClass, [c.classSessionId]: false });
                  }
                }}>
                  <div className="h-28 bg-gradient-to-br from-indigo-500/60 via-purple-500/60 to-blue-500/60 flex items-center justify-center">
                    <div className="text-white font-bold text-lg">{(c.topic || '').split(' ').map(w=>w[0]).join('').slice(0,3)}</div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm text-muted-foreground">{c.topic}</div>
                    <div className="font-semibold line-clamp-2">{c.title}</div>
                    <div className="text-xs text-muted-foreground">Class {c.sessionIndex}{c.totalClasses ? ` of ${c.totalClasses}` : ''}</div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs">{formattedDate} · {formattedTime}</span>
                      <Badge variant={status === 'Upcoming' || status === 'Today' ? 'default' : 'outline'}>
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      {c.googleCalendarEventId ? (
                        <Button variant="ghost" size="sm" className="mt-2 px-0 text-xs underline" onClick={(e) => { e.stopPropagation(); window.open(`https://calendar.google.com/calendar/r/eventedit/${c.googleCalendarEventId}`, '_blank'); }}>
                          View in Calendar
                        </Button>
                      ) : <div />}

                      <Button variant="default" size="sm" className="mt-2" onClick={async (e) => {
                        e.stopPropagation();
                        if (startingClass[c.classSessionId]) return;
                        setStartingClass({ ...startingClass, [c.classSessionId]: true });
                        try {
                          const res = await fetch(`/api/classes/${c.classSessionId}/start`, { method: 'POST' });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed to start class');
                          window.location.href = data.join_url;
                        } catch (err: any) {
                          console.error('Start class error', err);
                          setMessage(err?.message || 'Could not start the class. Please try again.');
                          setStartingClass({ ...startingClass, [c.classSessionId]: false });
                        }
                      }}>
                        {startingClass[c.classSessionId] ? 'Starting…' : 'Start Class'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
