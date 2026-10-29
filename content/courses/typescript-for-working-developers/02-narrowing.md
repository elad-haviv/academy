## הרעיון

TypeScript יודע לעדכן את הטיפוס בהתאם לבדיקות שכתבתם. זה נקרא narrowing, והוא הכלי שבגללו TypeScript נעים לעבודה — אתם לא מכריזים מחדש, אתם פשוט בודקים.

```ts
type Order = { kind: "paid"; amount: number } | { kind: "refund"; amount: number; reason: string };

function describe(order: Order) {
  if (order.kind === "refund") {
    return `החזר: ${order.reason}`;      // כאן order הוא סוג ה-refund בלבד
  }
  return `תשלום: ${order.amount}`;       // וכאן הסוג השני
}
```

השדה `kind` הוא discriminant. הצורה הזו — union של אובייקטים עם שדה מבחין — היא הכלי הכי שימושי ב-TypeScript לתיאור מצבים.

## הבדיקות ש-TypeScript מבין

```ts
if (value === null) {}            // null check
if (typeof value === "string") {} // typeof
if (Array.isArray(value)) {}      // Array.isArray
if ("error" in response) {}       // in operator
if (response.ok) {}               // truthiness על discriminant
if (isUser(data)) {}              // type predicate שכתבתם
```

האחרון הוא החשוב: פונקציה שמחזירה `value is User`. היא הדרך שלכם ללמד את TypeScript לזהות מבנה בעצמכם.

```ts
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value && "email" in value;
}
```

## כשל: `as` במקום בדיקה

```ts
const user = data as User;          // שקר. TypeScript יאמין, והקוד ייפול ב-runtime
if (isUser(data)) { const user = data; }  // אמת. הבדיקה נשארת בקוד
```

`as` הוא הצהרה "אני יודע יותר טוב". לפעמים זה נכון (למשל מיפוי מגבול מערכת שכבר אומת), אבל כל `as` הוא מקום שבו הטיפוסים לא מגינים.

## מקרה אמיתי: תשובת API

```ts
const response = await fetch("/api/course/1");
const json = await response.json();   // any

if (!isCourse(json)) {
  throw new Error("תשובה לא תקינה מהשרת");
}
// מכאן והלאה json הוא Course
```

זה גבול האמון — השיעור האחרון בקורס. הכלל: טיפוסים שנכנסים מבחוץ נבדקים פעם אחת בגבול, ואחרי זה זורמים בטוחים.

## תרגיל

קחו פונקציה אצלכם שמקבלת `string | number` ומטפלת בכל מקרה. כתבו אותה בלי `any` ובלי `as`. אם זה לא מסתדר — כנראה שהבדיקות לא מכסות מקרה אמיתי.
