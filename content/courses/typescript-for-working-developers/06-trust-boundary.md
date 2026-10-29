## הטיפוסים נכונים רק עד הגבול

TypeScript נעלם בזמן ריצה. כל מה שהוא מבטיח תקף רק על קוד שאתם כתבתם. ברגע שנתונים מגיעים מבחוץ — `fetch`, `JSON.parse`, טופס, משתנה סביבה, קובץ — ההבטחה נגמרת.

```ts
const data = await response.json() as Course;   // הקומפיילר מאמין. זה הכל.
```

אם השרת יחזיר `{ error: "..." }`, הקוד יקרוס במקום רחוק, עם הודעת שגיאה שלא מרמזת על הסיבה.

## דפוס: סכימה בגבול

```ts
import { z } from "zod";

const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  lessons: z.array(z.object({ slug: z.string(), minutes: z.number().int().positive() })),
});

const course = CourseSchema.parse(await response.json());   // זורק אם לא תקין
```

אפשר גם בלי ספרייה, עם פונקציית `isCourse` כמו בשיעור על narrowing. הספרייה נותנת הודעות שגיאה טובות יותר; הפונקציה הידנית נותנת אפס תלויות. שניהם טובים יותר מ-`as`.

## ארבעה גבולות שתמיד צריך לבדוק

1. **תשובות HTTP** — גם משירות פנימי.
2. **`JSON.parse`** — מחזיר `any`, ותמיד.
3. **`process.env`** — הכל `string | undefined`, אף פעם לא המספר שרציתם. המירו ובדקו פעם אחת באתחול.
4. **קלט משתמש** — טופס הוא בדיוק נתונים מבחוץ, גם אם הדפדפן בדק.

## אתחול קונפיגורציה בצורה בטוחה

```ts
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`חסר משתנה סביבה: ${name}`);
  return value;
}

export const config = {
  databaseUrl: requireEnv("DATABASE_URL"),
  port: Number(process.env.PORT ?? 3000),
};
```

התוצאה: האפליקציה נופלת מיד ובבירור באתחול, ולא באמצע בקשה כשמישהו כבר מחכה לתשובה.

## הכלל לסיום

כתבו את הבדיקות בגבול, פעם אחת, ותנו לטיפוסים לעבוד בפנים. זה ההבדל בין TypeScript שמקשט את הקוד לבין TypeScript שמונע תקלות.
