## מה `strict` באמת מפעיל

`strict: true` הוא קיצור לחבילת דגלים. החשובים:

- `strictNullChecks` — `null` ו-`undefined` הם טיפוסים נפרדים. זה 80% מהערך.
- `noImplicitAny` — פרמטר בלי טיפוס הוא שגיאה, לא `any` שקט.
- `strictFunctionTypes` — בדיקת שונות (variance) נכונה של פונקציות.
- `strictPropertyInitialization` — מחלקה חייבת לאתחל שדות.
- `useUnknownInCatchVariables` — `catch (e)` הוא `unknown`, לא `any`.

## איך מהגרים בלי לעצור את הפיתוח

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

`noUncheckedIndexedAccess` הוא לא חלק מ-strict, והוא שווה הפעלה: `arr[0]` מחזיר `T | undefined`, כי אינדקס יכול להיות מחוץ לתחום. זה מרגיש מעצבן לשבוע, ואז מונע באגים אמיתיים.

## הסדר שממזער כאב

1. הפעילו `strict`, קבלו רשימת שגיאות.
2. תקנו את הקלות (בעיקר `| undefined` שחסר).
3. בקבצים גדולים מדי — `// @ts-nocheck` זמני עם משימה במעקב, לא `any` בכל מקום.
4. כל קובץ שנוגעים בו — מסירים ממנו את ה-nocheck.

## `unknown` הוא חבר, לא אויב

```ts
try {
  await save();
} catch (error) {
  if (error instanceof Error) log(error.message);
  else log(String(error));
}
```

במצב strict, `catch` נותן `unknown` — וזה נכון, כי אפשר לזרוק כל דבר ב-JavaScript.

## הדבר שהכי משפר קוד TypeScript

לא generics ולא utility types — אלא **הסרת `any` מהחתימות של הפונקציות הציבוריות**. כל `any` בחתימה מדביק את כל מי שקורא לה. התחילו מהפונקציות שנקראות הכי הרבה; יש סיכוי טוב שזה יוריד חצי מהשגיאות.

```bash
npx tsc --noEmit 2>&1 | grep -c "any"   # לא מדויק, אבל נותן תחושה
```
