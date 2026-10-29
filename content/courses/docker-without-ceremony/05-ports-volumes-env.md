## פורטים: שלוש דרכים לאותו דבר

```bash
docker run -p 8080:3000 myapp        # 8080 במחשב → 3000 במכולה
docker run -p 127.0.0.1:8080:3000    # רק localhost, לא מהרשת
docker run --network host myapp      # בלי בידוד רשת (לינוקס בלבד)
```

`EXPOSE` בתוך ה-Dockerfile הוא תיעוד בלבד. בלי `-p` (או רשת משותפת) אין גישה מהחוץ.

טעות נפוצה: האפליקציה מאזינה ל-`127.0.0.1` בתוך המכולה. אז הפורט מפורסם אבל אין מה שיקשיב לו — צריך `0.0.0.0`.

## כרכים: מה ששורד

```bash
docker run -v mydata:/var/lib/postgresql/data postgres:16
docker run -v "$PWD/content:/app/content" myapp     # bind mount
docker run --mount type=bind,source="$PWD",target=/app,readonly myapp
```

שני סוגים ושימושים שונים:

- **Named volume** — מנוהל בידי Docker, שורד מחיקת מכולה, לא תלוי בנתיב במחשב. נכון למידע של אפליקציה: בסיס נתונים, קבצים שהועלו.
- **Bind mount** — מתלה תיקייה אמיתית. נכון לפיתוח (קוד חי) ולקבצי קונפיגורציה שמישהו עורך.

כלל: **נתונים לא גרים בתוך המכולה.** מכולה היא תהליך, לא דיסק.

## משתני סביבה

```bash
docker run --env-file .env.production myapp
docker run -e DATABASE_URL=postgres://... myapp
```

אל תעתיקו `.env` לתוך האימג'. ההבדל בין `COPY .env .` לבין `--env-file` הוא ההבדל בין סוד שדלף לבין סוד שנשאר סוד. גם אחרי מחיקת הקובץ מהאימג' — הוא נשאר בהיסטוריית השכבות.

## דיבוג מהיר

```bash
docker exec -it <container> sh          # להיכנס למכולה רצה
docker logs -f <container>              # מה התהליך מדפיס
docker inspect <container> | less       # mount-ים, env, רשת
docker stats                            # צריכת מעבד וזיכרון בזמן אמת
```

אם `docker logs` ריק אבל המכולה "עולה ונופלת" — התהליך כותב ל-stderr של תהליך אחר, או שהבחירה ב-CMD יוצרת shell שמת ולא מעביר stdout. בדקו `docker inspect --format '{{.State.ExitCode}}'`.
