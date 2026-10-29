## Generics = טיפוס שמקבל פרמטר

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

`T` הוא placeholder: הקורא קובע אותו. `first([1,2,3])` מחזיר `number | undefined`; `first(["a"])` מחזיר `string | undefined`. בלי generics הייתם צריכים `any`, והמידע היה נעלם.

## שלוש דוגמאות שמצדיקות generics

**1. פונקציית עזר על אוספים**

```ts
function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) (out[key(item)] ??= []).push(item);
  return out;
}
```

**2. תגובת API**

```ts
type ApiResponse<T> = { data: T; meta: { fetchedAt: string } };
async function get<T>(path: string): Promise<ApiResponse<T>> { /* ... */ }
const courses = await get<Course[]>("/api/courses");
```

**3. רכיב/פונקציה שמקבל רשימה ומחזיר את אותו סוג**

```ts
function wrap<T>(value: T): { value: T } {
  return { value };
}
```

## האילוץ: `extends`

`<T extends { id: string }>` אומר: כל טיפוס, אבל חייב להיות לו `id` מסוג מחרוזת. זה מה שמאפשר לגשת ל-`item.id` בלי לדעת את שאר הצורה.

```ts
function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
```

## שתי טעויות נפוצות

**יותר מדי פרמטרים.** פונקציה עם `<A, B, C, D>` היא כמעט תמיד סימן לפונקציה שעושה יותר מדי. פצלו אותה.

**Generics במקום אובייקט.** אם כל הפרמטרים תמיד מגיעים יחד, עדיף טיפוס אחד עם שדות.

## מתי לא להשתמש

כשקורא הפונקציה לא יכול לנחש את `T` — או כשהוא צריך לכתוב `<string, number, User>` בכל קריאה. Generics טובים הם שקופים: כותבים `groupBy(users, u => u.role)` והמערכת מסיקה לבד.
