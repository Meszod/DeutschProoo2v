import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { skill, level } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY not configured. Set it as a Supabase secret.",
          hint: "Go to Supabase Dashboard > Edge Functions > Secrets and add ANTHROPIC_API_KEY",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prompts: Record<string, string> = {
      lesen: `Erstelle eine originale deutsche Lesetext-Aufgabe für das Niveau ${level} im Goethe-Zertifikat Format.
Der Text soll original sein (kein Copy von echten Prüfungen), aber Format und Schwierigkeit sollen passen.
Antworte NUR mit einem JSON-Objekt mit folgender Struktur:
{
  "title": "Kurzer Titel",
  "content": {
    "text": "Der deutsche Text (ca. 150-250 Wörter für B1)",
    "questions": [
      {"type": "multiple_choice", "question": "Frage auf Deutsch", "options": ["A","B","C","D"], "answer": 0, "explanation": "Erklärung"},
      {"type": "true_false", "question": "Aussage", "answer": true, "explanation": "Erklärung"}
    ]
  }
}
Mindestens 4 Fragen. Der "answer" Index ist 0-basiert.`,
      hoeren: `Erstelle eine originale deutsche Hören-Aufgabe für das Niveau ${level}.
Antworte NUR mit JSON:
{
  "title": "Titel",
  "content": {
    "audio_script": "Deutscher Text zum Vorlesen (ca. 100-200 Wörter)",
    "questions": [
      {"type": "multiple_choice", "question": "Frage", "options": ["A","B","C"], "answer": 0, "explanation": "Erklärung"}
    ]
  }
}
Mindestens 4 Fragen.`,
      schreiben: `Erstelle eine originale Schreiben-Aufgabe für ${level} im Goethe-Format.
Antworte NUR mit JSON:
{
  "title": "Titel",
  "content": {
    "prompt": "Aufgabenbeschreibung auf Deutsch",
    "leitpunkte": ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4"],
    "min_words": 80,
    "max_words": 120
  }
}`,
      sprechen: `Erstelle eine originale Sprechen-Aufgabe für ${level}.
Antworte NUR mit JSON:
{
  "title": "Titel",
  "content": {
    "prompt": "Aufgabenbeschreibung",
    "leitpunkte": ["Punkt 1", "Punkt 2", "Punkt 3"],
    "min_duration_seconds": 90,
    "max_duration_seconds": 150
  }
}`,
    };

    const prompt = prompts[skill] || prompts.lesen;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Try to parse JSON from the response
    let taskData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      taskData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return new Response(
        JSON.stringify({ error: "Could not parse AI response as JSON", raw: text }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(taskData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
