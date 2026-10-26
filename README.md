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
3. **Сайт:** в `index.html` впиши `SUPABASE_URL` и `SUPABASE_ANON_KEY` (Project Settings → API).

Пока эти два поля пустые, сайт работает в демо-режиме: отчёт примерный, форма email скрыта.

## Перед запуском

- Заполни пропуски `[Имя]`, `[email]`, `[адрес]` в условиях и политике конфиденциальности (обе языковые версии).
- Фото лица — чувствительные данные по GDPR. Покажи юридические тексты юристу.
