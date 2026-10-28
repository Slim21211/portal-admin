# Supabase: доступ админов и запись в assets

Как это устроено:

- **Вход** — Supabase Auth, почта + пароль. Публичная регистрация выключена.
- **Список админов** — таблица `public.admins` (email в нижнем регистре). RLS на `cities` и `modals` пускает на запись только пользователей из неё (`public.is_admin()`).
- **Запись в `cse-portal-assets`** — только через Edge Function `assets`. Токен GitHub хранится в её секретах. Одна операция в админке = один коммит.

## Первичная настройка (один раз)

1. **Отозвать старый токен** `ghp_…` (GitHub → Settings → Developer settings → Personal access tokens). Он был виден в бандле `admin.cse-hr.ru`.
2. **Создать fine-grained токен:** Repository access → только `Slim21211/cse-portal-assets`, Permissions → Contents: Read and write.
3. **Выключить регистрацию:** Supabase → Authentication → Sign In / Providers → снять «Allow new users to sign up».
4. **Применить миграцию:** скопировать `migrations/20261028000000_admin_auth.sql` в SQL Editor и выполнить.
5. **Задеплоить функцию** (нужен [Supabase CLI](https://supabase.com/docs/guides/cli)), из корня репозитория:

   ```sh
   npx supabase login
   npx supabase link --project-ref odojxjtucayxduwgwunw
   npx supabase secrets set GH_ASSETS_TOKEN=github_pat_...
   npx supabase functions deploy assets --use-api
   ```

   Docker и `supabase start` не нужны: `--use-api` собирает функцию на стороне Supabase.
   Проверка JWT шлюзом выключена в `config.toml` (`verify_jwt = false`), потому что функция сама проверяет пользователя через `is_admin()`.
   По умолчанию функция пишет в `Slim21211/cse-portal-assets@main` и пускает запросы с `https://admin.cse-hr.ru` и `http://localhost:5173`. Это переопределяется секретами `GH_OWNER`, `GH_REPO`, `GH_BRANCH`, `ALLOWED_ORIGINS`.
6. **Удалить секрет `GH_ASSETS_TOKEN`** из GitHub-репозитория админки (Settings → Secrets → Actions): сборке он больше не нужен.
7. **Удалить старый бакет** Storage `portal-assets`: портал читает `assets.cse-hr.ru`, а в бакете лежат устаревшие файлы.

## Добавить или убрать админа

1. Authentication → Users → **Add user** → почта + пароль, отметить «Auto Confirm User».
2. Table Editor → `admins` → добавить строку с этой почтой в нижнем регистре.

Чтобы отобрать доступ, удалите строку из `admins`: это действует сразу. Пользователя в Auth можно оставить.
Сменить пароль: Authentication → Users → пользователь → Reset password / Update.
