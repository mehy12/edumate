import { StreamTranscriptItem } from "@/modules/meetings/types";
import { inngest } from "./client";
import JSONL from "jsonl-parse-stringify"
import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createAgent, TextMessage, gemini } from '@inngest/agent-kit'



const summarizer = createAgent({
    name: "summarizer",
    system: `
You are a summarizer for a meeting. You will be given a transcript of a meeting and your task is to summarize the meeting in 1-2 sentences.
`.trim(),

    model: gemini({
        model: 'gemini-2.0-flash',
        apiKey: "AIzaSyBCzkOBLlO4KKirVELzxrPsMWd_6M_6mSY"
    })

})



export const meetingsProcessing = inngest.createFunction(
    {
        id: "meetings/processing",
        retries: 2
    },
    { event: "meetings/processing" },
    async ({ event, step }) => {

        // const response = await step.run("fetch-transcript", async () => {
        //     return fetch(event.data.transcriptUrl).then(res => res.text())
        // })  
        // const transcript = await step.run("parse-transcript", async () => {
        //     return JSONL.parse<StreamTranscriptItem>(response)
        // })


        //use this during production

        const response = await step.fetch(event.data.transcriptUrl);//development

        const transcript = await step.run("parse-transcript", async () => {
            const text = await response.text();
            return JSONL.parse<StreamTranscriptItem>(text)
        })
        // const transcript = await step.run("parse-transcript", async () => {
        //     const text = await response.text();
        //     return JSONL.parse(text)
        // })

        const transcriptWithSpeakers = await step.run("add-speakers", async () => {
            const speakerIds = [
                ...new Set(transcript.map((item) => item.speaker_id))
            ]

            const userSpeakers = await db
                .select()
                .from(user)
                .where(inArray(user.id, speakerIds))
                .then((users) =>
                    users.map((user) => ({
                        ...user
                    })))

            const agentSpeakers = await db
                .select()
                .from(agents)
                .where(inArray(agents.id, speakerIds))
                .then((agents) =>
                    agents.map((agent) => ({
                        ...agent
                    })))

            const speakers = [...userSpeakers, ...agentSpeakers]

            return transcript.map((item) => {
                const speaker = speakers.find((speaker) => speaker.id === item.speaker_id)

                if (!speaker) {
                    return {
                        ...item,
                        user: {
                            name: "Unknown"
                        }
                    }
                }
                return {
                    ...item,
                    user: {
                        name: speaker.name
                    }
                }
            })

        })
        const { output } = await summarizer.run(
            "Summarize the following transcript" +
            JSON.stringify(transcriptWithSpeakers)
        )





        await step.run("save-summary", async () => {

            await db
                .update(meetings)
                .set({
                    status: "completed"
                })
                .where(eq(meetings.id, event.data.meetingId))
            await db
                .update(meetings)
                .set({
                    summary: (output[0] as TextMessage).content as string

                })
                .where(eq(meetings.id, event.data.meetingId))
        })
    }
)