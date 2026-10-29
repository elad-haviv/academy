## המודל הוא התיעוד

השאלה שכדאי לשאול בכל פרויקט: אילו מצבים קיימים במערכת, והאם הטיפוסים מאפשרים מצב שאין לו משמעות?

```ts
// ❌ אפשר לבנות הזמנה גם עם status="cancelled" וגם עם shippedAt
type Order = {
  status: string;
  shippedAt?: Date;
  cancelledReason?: string;
};

// ✅ כל מצב הוא צורה משלו
type Order =
  | { status: "draft" }
  | { status: "paid"; paidAt: Date }
  | { status: "shipped"; shippedAt: Date; tracking: string }
  | { status: "cancelled"; reason: string; cancelledAt: Date };
```

בגרסה השנייה, אם `status === "shipped"` אז בהכרח יש `tracking` — לא כי מישהו זכר, אלא כי אחרת זה לא קומפל.

## עקרון: ערכים בלתי אפשריים לא צריכים להיות מיוצגים

- מזהה משתמש הוא `string`? או שווה ערך ל-`UserId`? טיפוס חדש מונע העברת `courseId` במקום `userId`.
- כמות היא `number`? או `PositiveInt`? אם שלילי הוא שגיאה, הבדיקה שייכת לגבול, והטיפוס יכול לשקף את זה.
- האם `loading` ו-`data` יכולים להיות אמיתיים יחד? לרוב לא. שלושה שדות אופציונליים הם בדרך כלל union של ארבעה מצבים.

## Branded types בעשר שורות

```ts
type Brand<T, B> = T & { readonly __brand: B };
type UserId = Brand<string, "UserId">;
type CourseId = Brand<string, "CourseId">;

function getUser(id: UserId) { /* ... */ }
const courseId = "c1" as CourseId;
getUser(courseId);   // שגיאה — בדיוק מה שרצינו
```

זה לא קסם; זו מטלה של תגית שמונעת החלפה בטעות בין מזהים דומים.

## טבלאות lookup במקום string

```ts
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVELS)[number];       // "beginner" | "intermediate" | "advanced"
```

מכאן מקבלים גם אימות runtime (`LEVELS.includes(value)`) וגם השלמה אוטומטית, בלי כפילות של רשימה.

## מתי להפסיק

מודל טיפוסים הוא כלי, לא מטרה. אם טיפוס גורם לכם לכתוב שלוש המרות בכל קריאה — כנראה שהוא לא מתאר את הדומיין נכון, או שאתם מגזימים. הכלל: כל טיפוס צריך למנוע באג אמיתי או לתעד החלטה אמיתית.
