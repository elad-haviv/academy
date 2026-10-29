# Haviv Academy

הדור הבא של TutsZone: פורטל קורסים, מדריכים ומעבדות לימוד אינטראקטיביות בעברית.

- אתר חי: https://academy.haviv.pro
- עברית כברירת מחדל, `dir="rtl"`

## מה יש בו

| חלק | נתיב | מה זה |
|---|---|---|
| בית | `/` | סקירה, קורסים מומלצים, מעבדות, מדריכים |
| קטלוג | `/courses` | חיפוש, סינון לפי רמה ונושא, מיון |
| קורס | `/courses/[slug]` | מערך שיעורים, הרשמה, דירוגים |
| למידה | `/learn/[course]/[lesson]` | שיעור עם סרגל התקדמות וסימון השלמה |
| מדריכים | `/tutorials` | מאמרים קצרים, סינון לפי תג |
| מעבדות | `/labs` | קורסים אינטראקטיביים (AGL ועוד) |
| לוח בקרה | `/dashboard` | הקורסים שלי והתקדמות |
| חשבון | `/login`, `/register` | אימות מבוסס עוגיית סשן |

## סטאק

- Next.js 14 (App Router) + React 18 + TypeScript
- `node:sqlite` — ללא תלות native, מסד נתונים בקובץ (`ACADEMY_DATA_DIR/academy.db`)
- CSS בכתב יד (`src/app/globals.css`), בלי Tailwind
- אימות: scrypt + טבלת סשנים, עוגייה `httpOnly`

## תוכן

התוכן יושב ב־`content/` ונזרע למסד הנתונים באתחול. שינוי קבצים → hash חדש → זריעה מחדש אוטומטית (משתמשים והתקדמות נשמרים).

```
content/courses/<slug>/course.json   # מטא + מודולים + שיעורים
content/courses/<slug>/NN-lesson.md  # גוף השיעור ב-Markdown
content/tutorials/<slug>.md          # frontmatter + Markdown
public/labs/agl/                     # קורס AGL הסטטי (מועתק מ-elad-haviv/agl-edu)
```

להוספת קורס: צרו תיקייה עם `course.json` וקבצי Markdown, ופרסו מחדש.

## הרצה מקומית

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # בדיקת בנייה
```

## פריסה

Docker (multi-stage, standalone). Coolify: build pack `dockerfile`, פורט 3000, דומיין `https://academy.haviv.pro`, נפח התמדה על `/data`.

## קרדיט

נבנה ומתוחזק בידי אלעד חביב, יחד עם סוכן AI (Hermes).
