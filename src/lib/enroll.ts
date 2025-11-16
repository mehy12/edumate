export type LearningSpeed = 'slow' | 'normal' | 'fast';

export function estimateClassesForTopic(topic: string, speed: LearningSpeed = 'normal') {
  const words = topic.trim().split(/\s+/).filter(Boolean).length;
  // heuristic: words per class by speed
  const wordsPerClass = speed === 'slow' ? 250 : speed === 'fast' ? 800 : 400;
  const base = Math.max(1, Math.ceil(words / wordsPerClass));

  // Small topics still deserve at least 1 class, medium topics get a small bump
  const extra = words > 2000 ? Math.ceil(words / 2000) : 0;

  return base + extra;
}

export function generateSessionPlan(topic: string, classCount: number) {
  const sessions = [] as { title: string; description?: string }[];
  for (let i = 0; i < classCount; i++) {
    sessions.push({
      title: `Part ${i + 1}: ${topic.slice(0, Math.max(20, Math.floor(topic.length / Math.max(1, classCount))))}`,
      description: undefined,
    });
  }
  return sessions;
}

export default { estimateClassesForTopic, generateSessionPlan };
