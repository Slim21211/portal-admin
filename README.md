# CSE Portal Admin

Панель управления контентом корпоративного портала КСЭ.

## Настройка Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. Перейди в **Storage** → **New bucket**
   - Название: `portal-assets`
   - Public bucket: ✅ включить
3. Перейди в **Storage** → **Policies** → добавь политику для bucket `portal-assets`:
   - Разрешить `INSERT` и `UPDATE` для `anon` роли (или настрой auth)

## Запуск

```bash
cp .env.example .env
# заполни VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY из настроек проекта Supabase

npm install
npm run dev
```

## Деплой на Vercel

1. Залей репозиторий на GitHub
2. Подключи к Vercel
3. Добавь переменные окружения:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Скрипт для портала

После загрузки картинки она доступна по URL:
```
https://[project].supabase.co/storage/v1/object/public/portal-assets/birthday/today.png
```

Вставь в скрипт на портале:
```javascript
var FILE_URL = 'https://[project].supabase.co/storage/v1/object/public/portal-assets/birthday/today.png'
```
