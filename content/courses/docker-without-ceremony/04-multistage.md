## הבעיה

אימג' Node טיפוסי עם `node_modules` מלא שוקל 800MB–1.2GB. 90% ממנו הוא תלויות בנייה, קומפיילרים וכלים שלא נדרשים בזמן ריצה. כל פריסה מעבירה את כל זה לשרת, וכל חולשה באחת מהחבילות האלה היא חולשה שלכם.

## הפתרון: שני שלבים

```dockerfile
# שלב הבנייה
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# שלב ההרצה
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./
EXPOSE 3000
USER node
CMD ["node_modules/.bin/next", "start"]
```

מה שקורה: השלב הראשון מכיל את כל הכלים וכבד. השלב השני מתחיל מתמונה נקייה ומעתיק **רק את התוצרים**. מה שלא הועתק — לא קיים באימג'. התוצאה: 150MB–250MB, ומשטח תקיפה קטן.

## `USER node` — לא לוותר על זה

ברירת המחדל היא root. אם תהליך בתוך המכולה נפרץ, התוקף root **בתוך** המכולה, וזה צעד אחד קרוב יותר לבריחה. הוסיפו משתמש לא-מיוחד:

```dockerfile
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
```

## Build args מול משתני סביבה

```dockerfile
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine
```

`ARG` זמין רק בזמן בנייה; `ENV` נכנס לאימג' וקיים בזמן ריצה. **אל תשימו סודות ב-ARG או ב-ENV** — הם נראים ב-`docker history`. סודות מגיעים בזמן ריצה, ממשתני סביבה או מקובץ mount.

## בדיקה שהאימג' לא שבור

Multi-stage הוא מקום קלאסי לשבור דברים בשקט: שכחתם להעתיק `public/`, או `package.json`, והבנייה מצליחה אבל האפליקציה נופלת בהרצה.

```bash
docker run --rm myapp:prod
docker run --rm myapp:prod sh -c "ls -la /app"
docker images myapp:prod    # גודל סופי
```

כלל אצבע: אם האימג' ירד ביותר מ-60% — בדקו שהוא באמת עובד.
