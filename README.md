# ZenvyMax

Скан лица, оценка по шкале PSL и план softmaxxing. Сайт на русском и английском.

## Состав

| Путь | Что это |
|---|---|
| `index.html` | Весь сайт, один файл. Хостится на GitHub Pages. |
| `supabase/functions/analyze` | Edge Function: отправляет фото в Claude и возвращает отчёт. Фото не сохраняется. |
| `supabase/migrations` | Таблица `waitlist` для email раннего доступа. Сайт может только добавлять записи. |

## Запуск

1. **GitHub Pages:** Settings → Pages → Branch `main`, папка `/ (root)`.
2. **Supabase:** создай проект (регион EU), затем:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-... ALLOWED_ORIGIN=https://nikitawizz01.github.io
   supabase functions deploy analyze
   ```
3. **Сайт:** `SUPABASE_URL` и публичный ключ уже вписаны в `index.html`. Форма email работает.
4. **ИИ:** добавь `ANTHROPIC_API_KEY` в Supabase → Edge Functions → Secrets и поставь `AI_ENABLED = true` в `index.html`. До этого отчёт остаётся демо.

Функция `analyze` развёрнута с выключенной проверкой JWT: сайт обращается к ней с публичным ключом.

## Перед запуском

- Заполни пропуски `[Имя]`, `[email]`, `[адрес]` в условиях и политике конфиденциальности (обе языковые версии).
- Фото лица — чувствительные данные по GDPR. Покажи юридические тексты юристу.
