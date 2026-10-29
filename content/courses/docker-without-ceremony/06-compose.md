## למה לא פקודות ארוכות

`docker run` עם שמונה דגלים הוא לא תיעוד. Compose מתאר את המערכת בקובץ שנכנס ל-git, וכל מי שמצטרף לפרויקט מריץ פקודה אחת.

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://academy:secret@db:5432/academy
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: academy
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: academy
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U academy"]
      interval: 5s
      retries: 10

volumes:
  dbdata:
```

## שלוש נקודות שהכי שוברות אנשים

**1. שם השירות הוא שם המארח.** `db:5432` עובד כי Compose יוצר רשת פנימית ונותן לכל שירות DNS פנימי. `localhost:5432` **לא** יעבוד מתוך `web` — זה ינסה את המכולה עצמה.

**2. `depends_on` לא מחכה שהשירות מוכן.** הוא מחכה שהוא *התחיל*. בסיס נתונים לוקח עוד כמה שניות. או `condition: service_healthy` עם healthcheck, או לוגיקת retry באפליקציה — עדיף את שניהם.

**3. `restart: unless-stopped`** הופך את המערכת לשורדת ריסטארט של המכונה. בלעדיו כל עדכון מערכת מכבה את האתר עד שמישהו יזכור.

## פקודות היום־יום

```bash
docker compose up -d                    # להעלות את הכל ברקע
docker compose up -d --build web        # לבנות מחדש שירות אחד
docker compose logs -f web              # לוגים
docker compose exec web sh              # כניסה לתוך שירות
docker compose down                     # לעצור ולמחוק מכולות (כרכים נשארים)
docker compose down -v                  # גם הכרכים — מוחק נתונים!
```

## כללי אצבע לפרויקט אמיתי

- קובץ `.env` אחד לכל סביבה, ו-`.env.example` ב-git עם שמות בלבד.
- אל תפרסמו פורטים של בסיס נתונים ל-`0.0.0.0`; אם צריך גישה חיצונית, עשו tunnel.
- כל שירות עם `healthcheck` — אחרת אין לכם מושג אם המערכת באמת עובדת.
- תנו לשירותים שמות ברורים (`web`, `db`, `cache`), לא `app1`, `app2`.
