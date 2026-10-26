// ZenvyMax — Supabase Edge Function "analyze": принимает фото с сайта и возвращает PSL-отчёт через Claude API.
// Секрет: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Фото нигде не сохраняется: оно живёт только в памяти этого запроса.

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*"; // например https://nikitawizz01.github.io
const PSL_MIN = 3.8, PSL_MAX = 4.7;

const SYSTEM = `Ты — аналитик внешности в приложении ZenvyMax (softmaxxing, только безопасные методы). Тебе присылают фото лица анфас.
Верни ТОЛЬКО валидный JSON без пояснений:
{
 "psl": 4.2,
 "metrics": {"canthal": 3.1, "fwhr": 1.88, "midface": 1.01, "thirds": [32,35,33], "symmetry": 90, "gonial": 124},
 "findings": [{"id":"bloat","severity":"high","title":"...","observation":"...","actions":["...","..."]}],
 "strengths": [{"title":"...","note":"..."}],
 "verdict": "..."
}

Правила оценки:
- psl от ${PSL_MIN} до ${PSL_MAX} (уровни MTN или HTN). Ниже ${PSL_MIN} не ставь никогда.
- metrics — приблизительная визуальная оценка по фото: canthal в градусах, fwhr и midface с двумя знаками, thirds в процентах (сумма 100), symmetry в процентах, gonial в градусах.

Правила разбора:
- findings: 4–5 пунктов, отсортированы по приоритету. severity: "high" (1–2 пункта), "mid", "low".
  id одно из: bloat, jaw, skin, eyes, hair, brows, posture.
- Пиши прямо и конкретно, как строгий тренер: что именно видно на ЭТОМ фото (зона, сторона, характер). Без воды и без утешений, но без оскорблений.
- Каждый пункт — то, что реально видно. Не выдумывай прыщи, которых нет.
- actions: 3–4 конкретных действия, только безопасные: вода, соль, сон, лимфодренаж, уход за кожей, SPF, стрижка, брови, щетина, осанка, спорт, процент жира.
- НИКОГДА не советуй: bonesmashing, удары по лицу, стероиды, голодание, операции, филлеры, препараты по рецепту. При серьёзных проблемах кожи — «к дерматологу».
- strengths: ровно 2 реальных сильных стороны.
- verdict: 2 предложения — что даст самый быстрый видимый результат за 30 дней.
- Не упоминай расу, национальность, вес в цифрах.
- Весь текст на языке из запроса: "ru" — русский, "en" — английский.

Если на фото нет одного чёткого лица анфас, верни {"error":"no_face"}.
Если человек на фото может быть младше 18 лет, верни {"error":"under_18"}.`;

const MSG: Record<"ru" | "en", Record<string, string>> = {
  ru: { bad: "Неверный запрос", nophoto: "Фото не получено или слишком большое", down: "Анализ сейчас недоступен. Попробуй через пару минут.",
        parse: "Не удалось собрать отчёт. Попробуй другое фото.", no_face: "Не вижу лицо анфас. Сделай фото прямо, при дневном свете.", under_18: "Анализ доступен только для 18+." },
  en: { bad: "Invalid request", nophoto: "No photo received or it is too large", down: "Analysis is unavailable right now. Try again in a couple of minutes.",
        parse: "Couldn't build the report. Try another photo.", no_face: "No front-facing face found. Take the photo straight on, in daylight.", under_18: "Analysis is available for 18+ only." },
};

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { image?: string; lang?: string };
  try { body = await req.json(); } catch { return json({ error: MSG.ru.bad }, 400); }
  const lang = body.lang === "en" ? "en" : "ru";
  const t = MSG[lang];
  if (!body.image || body.image.length > 3_000_000) return json({ error: t.nophoto }, 400);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 1800,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: body.image } },
          { type: "text", text: `Сделай разбор по правилам. Язык: ${lang}` },
        ],
      }],
    }),
  });
  if (!r.ok) return json({ error: t.down }, 502);

  const data = await r.json();
  const text = (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return json({ error: t.parse }, 502);

  let out;
  try { out = JSON.parse(m[0]); } catch { return json({ error: t.parse }, 502); }
  if (out.error) return json({ error: (t as Record<string, string>)[out.error] ?? t.parse }, 422);

  out.psl = Math.min(PSL_MAX, Math.max(PSL_MIN, Number(out.psl) || 4.1));
  out.findings = Array.isArray(out.findings) ? out.findings.slice(0, 5) : [];
  out.strengths = Array.isArray(out.strengths) ? out.strengths.slice(0, 2) : [];
  return json(out);
});
