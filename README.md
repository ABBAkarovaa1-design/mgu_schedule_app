# МГУ Schedule — Telegram Mini App

## 1. Подготовка
```bash
cp .env.example .env
```
Заполни `BOT_TOKEN`, `WEBAPP_URL`, `ADMIN_PASSWORD`.

Положи эмблему МГУ в `static/mgu.png`.

## 2. Запуск Docker
```bash
docker compose up -d --build
```

Mini App будет доступен на `http://SERVER:8000`. Для Telegram нужен HTTPS.
На VPS обычно ставят Nginx/Caddy перед контейнером и получают `https://schedule.example.ru`.

## 3. Telegram
Создай бота через @BotFather и укажи URL Mini App как `WEBAPP_URL`.
Запусти:
```bash
python bot.py
```
Или добавь отдельный bot-контейнер при необходимости.

## 4. Админка
Открой:
`https://YOUR-DOMAIN/admin`

Пароль — `ADMIN_PASSWORD`.

В админке можно:
- создавать и удалять группы;
- добавлять/удалять пары;
- указывать неделю (0 = текущая, +1 следующая, -1 предыдущая);
- загружать XLSX;
- делать резервные копии SQLite.

## 5. Формат Excel
Первая строка должна содержать:
`group, day, start, end, subject`

Дополнительно:
`teacher, room, faculty, week, lesson_type, note`

Пример:
| group | day | start | end | subject | teacher | room | week |
|---|---|---|---|---|---|---|---|
| ИС-101 | Понедельник | 09:00 | 10:30 | Математический анализ | Иванов И.И. | ГУМ 301 | 0 |

## Безопасность перед публичным запуском
- поменять `ADMIN_PASSWORD`;
- использовать HTTPS;
- не публиковать `.env`;
- ограничить админку по Telegram ID или VPN;
- регулярно делать backup;
- для большой нагрузки заменить SQLite на PostgreSQL.

## Эмблема
`static/mgu.png` должна быть официальной/разрешённой для использования эмблемой МГУ.
