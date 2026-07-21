import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TaskContent {
  text?: string;
  questions?: Array<{
    type: "multiple_choice" | "true_false";
    question: string;
    options?: string[];
    answer: number | boolean;
    explanation: string;
  }>;
  audio_script?: string;
  prompt?: string;
  max_words?: number;
  min_words?: number;
  leitpunkte?: string[];
  max_duration_seconds?: number;
  min_duration_seconds?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { skill, level } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let taskContent: TaskContent;
    let title: string;

    if (skill === "lesen" || skill === "hoeren") {
      const text = `Am Wochenende fährt Familie Müller ans Meer. Sie packen am Freitagabend die Koffer. Am frühen Samstagmorgen um 6 Uhr brechen sie auf. Die Fahrt dauert vier Stunden. Unterwegs machen sie eine Pause an einer Raststätte. Dort trinken sie Kaffee und essen ein Brötchen. Gegen 10 Uhr kommen sie am Strand an. Die Kinder spielen im Sand, während die Eltern am Strand liegen. Das Wetter ist wunderbar: die Sonne scheint und es ist warm. Am Abend gehen sie in ein Restaurant und essen frischen Fisch. Am Sonntag fahren sie wieder nach Hause.`;
      taskContent = {
        text: skill === "lesen" ? text : undefined,
        audio_script: skill === "hoeren" ? text : undefined,
        questions: [
          { type: "multiple_choice", answer: 1, options: ["Freitagmorgen", "Samstagmorgen", "Samstagmittag", "Sonntagmorgen"], question: "Wann brechen sie auf?", explanation: "Am frühen Samstagmorgen um 6 Uhr." },
          { type: "multiple_choice", answer: 1, options: ["2 Stunden", "4 Stunden", "6 Stunden", "8 Stunden"], question: "Wie lange dauert die Fahrt?", explanation: "Die Fahrt dauert vier Stunden." },
          { type: "true_false", answer: true, question: "Die Kinder spielen im Sand.", explanation: "Die Kinder spielen im Sand." },
          { type: "multiple_choice", answer: 1, options: ["Pizza", "Frischen Fisch", "Burger", "Salat"], question: "Was essen sie am Abend?", explanation: "Sie essen frischen Fisch." },
        ],
      };
      title = skill === "lesen" ? "Familie Müller am Meer" : "Am Strand";
    } else if (skill === "schreiben") {
      taskContent = {
        prompt: `Schreibe eine E-Mail an deinen Freund. Erzähle von deinem letzten Wochenende. Was hast du gemacht? ${level === "A1" || level === "A2" ? "Schreibe etwa 30-50 Wörter." : "Schreibe etwa 80-100 Wörter."}`,
        max_words: level === "A1" || level === "A2" ? 60 : 120,
        min_words: level === "A1" || level === "A2" ? 30 : 80,
        leitpunkte: ["Begrüßung", "Was du am Wochenende gemacht hast", "Ein Erlebnis beschreiben", "Verabschiedung"],
      };
      title = "E-Mail über das Wochenende";
    } else {
      taskContent = {
        prompt: `Sprechen Sie über Ihr letztes Wochenende. Was haben Sie gemacht? ${level === "A1" || level === "A2" ? "Dauer: ca. 1 Minute." : "Dauer: ca. 2 Minuten."}`,
        leitpunkte: ["Samstag: Was gemacht?", "Sonntag: Was gemacht?", "Besonderes Erlebnis", "Nächstes Wochenende Pläne"],
        max_duration_seconds: level === "A1" || level === "A2" ? 90 : 150,
        min_duration_seconds: level === "A1" || level === "A2" ? 45 : 90,
      };
      title = "Mein Wochenende";
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({ skill, level, exam_type: "Goethe", teil_number: 1, title, content: taskContent })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
