export interface EventDraft {
  title?: string;
  eventType?: string;
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  isReadyForConfirmation?: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

const getSystemPrompt = (currentDraft: EventDraft) => {
  return `
You are a church assistant. Your job is to extract event details from the Pastor and update the draft using a JSON block.

REQUIRED FIELDS:
- title
- startDateTime (ISO format)
- venueName

OPTIONAL FIELDS:
- endDateTime
- notes

CURRENT DRAFT:
${JSON.stringify(currentDraft, null, 2)}

CONVERSATION RULES:
1. ALWAYS output an <updateDraft> JSON block at the end of your response to silently save any newly provided details.
2. If any REQUIRED fields are still missing from the CURRENT DRAFT, ask for EXACTLY ONE missing field. Do NOT list the missing fields.
3. NEVER ask for optional details like end time or notes.
4. If the CURRENT DRAFT plus the user's latest input contains all 3 REQUIRED fields, you MUST add "isReadyForConfirmation": true to your JSON block, and ask "Shall I create this event?".
5. Keep the conversation natural, respectful, and concise.

<updateDraft> EXAMPLE:
<updateDraft>
{
  "title": "Sunday Worship",
  "startDateTime": "2026-07-14T17:00:00",
  "endDateTime": "2026-07-14T18:00:00",
  "venueName": "Kakinada Church",
  "notes": "Come 15 minutes early",
  "isReadyForConfirmation": true
}
</updateDraft>

EXAMPLE CONVERSATION 1:
Pastor: Create a youth revival meeting on Friday evening.
You: Certainly, Pastor. I can help with that. Could you please tell me the start time?
<updateDraft>{"title": "Youth revival meeting", "startDateTime": "2026-06-26"}</updateDraft>

Pastor: 6 PM.
You: Thank you, Pastor. May I also have the venue or location?
<updateDraft>{"startDateTime": "2026-06-26T18:00:00"}</updateDraft>

Pastor: Church of God, Koilakuntla.
You: Thank you, Pastor. Here is the event summary:
Event Name: Youth revival meeting
Date: Friday
Time: 6:00 PM
Location: Church of God, Koilakuntla
Shall I create this event?
<updateDraft>{"venueName": "Church of God, Koilakuntla", "isReadyForConfirmation": true}</updateDraft>

EXAMPLE CONVERSATION 2:
Pastor: Create a Sunday Worship service on July 14th at 5 PM at Kakinada Church, and add a note to come 15 minutes early.
You: Thank you, Pastor. Here is the event summary:
Event Name: Sunday Worship Service
Date: July 14
Time: 5:00 PM
Location: Kakinada Church
Notes: Please come 15 minutes early
Shall I create this event?
<updateDraft>{"title": "Sunday Worship Service", "startDateTime": "2026-07-14T17:00:00", "venueName": "Kakinada Church", "notes": "Please come 15 minutes early", "isReadyForConfirmation": true}</updateDraft>
`;
};

export const sendToGroq = async (
  messages: Message[],
  currentDraft: EventDraft,
  onToolCall: (draftUpdate: Partial<EventDraft>) => void
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key is missing');
  }

  // Send the last 10 messages so the AI actually has context of the conversation
  const formattedMessages: any[] = [
    { role: 'system', content: getSystemPrompt(currentDraft) },
    ...messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content || '',
    }))
  ];

  const makeRequest = async (msgs: any[]) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: msgs,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error (${response.status}):`, errorText);
      throw new Error(`Groq ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  };

  try {
    let responseMessage = await makeRequest(formattedMessages);
    let finalContent = responseMessage.content || "Could you tell me a bit more?";

    // Extract custom JSON tool call
    const toolMatch = finalContent.match(/<updateDraft>([\s\S]*?)<\/updateDraft>/i);
    if (toolMatch && toolMatch[1]) {
      try {
        let jsonStr = toolMatch[1].trim();
        // Remove markdown backticks if present
        jsonStr = jsonStr.replace(/^```json/i, '').replace(/```$/i, '').trim();
        
        // Extract from first { to last }
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        // Strip out comments (e.g. // or /* */) that LLMs sometimes hallucinate, preserving strings
        jsonStr = jsonStr.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m: string, g: string) => g ? "" : m);
        
        const args = JSON.parse(jsonStr);
        onToolCall(args);
      } catch (e) {
        console.error("Failed to parse tool JSON", e, "Raw string:", toolMatch[1]);
      }
    }

    // Clean up the text by removing the tag block and any residual broken tags
    finalContent = finalContent.replace(/<updateDraft>[\s\S]*?<\/updateDraft>/gi, '').trim();
    finalContent = finalContent.replace(/<updateDraft>[\s\S]*/gi, '').trim(); // Catch unclosed tags
    finalContent = finalContent.replace(/\{"[\s\S]*?\}/g, '').trim(); // Catch raw JSON
    
    return finalContent || "I've updated the draft.";
  } catch (error) {
    console.error('Error communicating with Groq:', error);
    throw error;
  }
};

export const transcribeAudio = async (fileUri: string): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key missing');

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'audio/m4a',
    name: 'audio.m4a'
  } as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('prompt', 'The following is a natural conversation. It may be in English or Telugu. Please transcribe it accurately in its native language without translating or phoneticizing.');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Whisper error:', err);
      throw new Error('Whisper transcription failed');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
