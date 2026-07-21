import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface TaskRequest {
  skill: "lesen" | "hoeren" | "schreiben" | "sprechen";
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  topic?: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  lesen: `You are a German exam expert. Generate a reading comprehension task in Goethe/telc format. Return JSON with: title (string), text (German passage, 150-300 words depending on level), questions (array of {id, question, options[4], correct_index}). Match difficulty to the given CEFR level.`,
  hoeren: `You are a German exam expert. Generate a listening task. Return JSON with: title (string), transcript (German text to be read aloud, 100-250 words), questions (array of {id, question, options[4], correct_index}). Match difficulty to the given CEFR level.`,
  schreiben: `You are a German exam expert. Generate a writing task. Return JSON with: title (string), prompt (German writing prompt with instructions, word count requirement, and situation context), min_words (number), max_words (number), assessment_criteria (array of {criterion, description}). Match difficulty to the given CEFR level.`,
  sprechen: `You are a German exam expert. Generate a speaking task. Return JSON with: title (string), prompt (German speaking prompt with situation, role, and task description), preparation_time (seconds), speaking_time (seconds), assessment_criteria (array of {criterion, description}). Match difficulty to the given CEFR level.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TaskRequest = await req.json();
    const { skill, level, topic } = body;

    if (!skill || !level) {
      return new Response(JSON.stringify({ error: "skill and level are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = SYSTEM_PROMPTS[skill] || SYSTEM_PROMPTS.lesen;
    const userMessage = topic
      ? `Generate a ${level} level ${skill} task about: ${topic}. Return ONLY valid JSON, no markdown.`
      : `Generate a ${level} level ${skill} task. Return ONLY valid JSON, no markdown.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "AI request failed", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.content?.[0]?.text || "";

    let task;
    try {
      task = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        task = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON from AI");
      }
    }

    return new Response(JSON.stringify({ task }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
