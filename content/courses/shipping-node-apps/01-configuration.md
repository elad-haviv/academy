## הקו: קוד זהה בכל סביבה, קונפיגורציה שונה

```ts
// ❌ הסביבה מקודדת
const db = connect("postgres://localhost:5432/academy");

// ✅ הקונפיגורציה מגיעה מבחוץ
const db = connect(requireEnv("DATABASE_URL"));
```

כל מה שמשתנה בין מחשב המפתחים, סביבת הבדיקות והשרת — חייב להיות בקונפיגורציה. כל מה שזהה — שייך לקוד. ברגע שמתחילים לכתוב `if (process.env.NODE_ENV === "production")` בתוך לוגיקה עסקית, משהו במודל לא נכון.

## אימות באתחול, לא בשרת

```ts
const schema = {
  DATABASE_URL: (v?: string) => v ?? fail("DATABASE_URL"),
  PORT: (v?: string) => Number(v ?? "3000"),
  SESSION_SECRET: (v?: string) => {
    if (!v || v.length < 32) fail("SESSION_SECRET חייב להיות באורך 32 תווים לפחות");
    return v;
  },
};

function fail(name: string): never {
  throw new Error(`קונפיגורציה חסרה או שגויה: ${name}`);
}
```

עדיף שהתהליך ייפול בעלייה עם הודעה ברורה, מלקבל שגיאה בעמוד 500 כשמישהו כבר משתמש.

## סודות: שלוש כללים

1. **לא ב-git.** `.env` ב-`.gitignore`, `.env.example` עם שמות בלבד.
2. **לא בלוגים.** מסננים מפתחות כמו `password`, `token`, `authorization`, `cookie` — ולא מדפיסים את כל ה-`process.env`.
3. **לא בקוד הקליינט.** כל משתנה שנכנס ל-bundle של הדפדפן גלוי לכולם. ב-Next.js כל דבר עם קידומת `NEXT_PUBLIC_` נשלח לדפדפן.

## ערכים עם טיפוסים

משתני סביבה הם תמיד מחרוזות. `PORT=3000` הוא `"3000"`, לא `3000`. המירו במקום אחד, עם בדיקה:

```ts
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) throw new Error("PORT לא תקין");
```

## בדיקת שפיות

הריצו את האפליקציה עם קונפיגורציה חסרה בכוונה:

```bash
env -i PATH="$PATH" node server.js
```

אם היא עולה ומשרתת בקשות — כנראה שיש ברירת מחדל מסוכנת בקוד. אם היא נופלת עם הודעה ברורה — עשיתם את זה נכון.
