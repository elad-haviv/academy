---
title: "CSS :has() — הסלקטור שמחליף JavaScript"
excerpt: בחירת הורה לפי מה שיש בתוכו, בלי קוד. שימושים אמיתיים: טפסים, כרטיסים, ניווט, מצבים ריקים.
tags: CSS, Frontend
level: Intermediate
minutes: 6
published: 2026-10-08
---

`:has()` מאפשר לשאול "האם יש לי צאצא שעונה לתנאי?" — כלומר לבחור **הורה** לפי תוכן. זה פתח דלת לכל מיני דפוסים שהיו דורשים JavaScript.

```css
/* כרטיס שיש בו תמונה — מקבל ריפוד אחר */
.card:has(img) { padding-top: 0; }

/* שדה עם ערך לא תקין — סגנון אדום על התווית */
label:has(input:invalid) { color: #a4302a; }

/* טופס שיש בו לפחות שדה אחד שמולא */
form:has(input:not(:placeholder-shown)) .hint { display: none; }
```

## השימושים שבאמת חוסכים קוד

**מצב ריק:** `ul:not(:has(li))` — להציג הודעה כשאין פריטים, בלי תנאי ב-JS.

**תפריט עם פריט פעיל:** `nav:has([aria-current="page"]) .badge { display: none; }`

**תלות בין שדות:** `.field:has(select[value="custom"]) .custom-input { display: block; }` — עם `:has` ו-`:checked` אפשר לבנות טפסים שמגיבים בלי סקריפט.

**בורר כפתורים:** `label:has(input:checked)` — כפתור שנבחר, נטו ב-CSS.

## גבולות שכדאי להכיר

- `:has()` לא עובד עם `:has()` מקונן בכמה מקרים, וביצועים יורדים ככל שהסלקטור כללי יותר. צמצמו: `article:has(> img)` במקום `div:has(img)`.
- אין לזה השפעה על סדר ה-DOM, רק על עיצוב. אם צריך לשנות מבנה — זה עדיין JavaScript.
- תמיכה בדפדפנים: כולם מ-2023. לפרויקטים עם דפדפנים עתיקים, הוסיפו `@supports selector(:has(*))`.

## דוגמה מלאה

```css
/* טופס עם שגיאה — מסמן את הכפתור */
form:has(.error) button[type="submit"] {
  background: #a4302a;
  border-color: #a4302a;
}
```

לפני `:has()`, זה היה מחייב קוד שמאזין לכל שינוי בשדות ומעדכן class על הטופס. עכשיו זו שורת CSS אחת, שממשיכה לעבוד גם כשמוסיפים שדה חדש.
