---
title: git rebase בלי פחד
excerpt: מה rebase באמת עושה לעץ, מתי הוא בטוח, ואיך יוצאים ממנו כשהוא משתבש.
tags: Git
level: Beginner
minutes: 2
published: 2026-10-21
category: software
tracks: developer
access: free
---

Rebase מפחיד כי כותבים עליו "משכתב היסטוריה". זה נכון, אבל זה גם בדיוק מה שהוא עושה — ומרגע שמבינים את זה, הוא כלי פשוט.

## מה קורה בפועל

`git rebase main` על הענף שלכם לוקח את הקומיטים שלכם, ומחיל אותם מחדש מעל `main`. הקומיטים הישנים לא משתנים; נוצרים חדשים עם אותם שינויים ו-hash חדש.

```bash
git switch feature/login
git fetch origin
git rebase origin/main
```

## מתי זה בטוח

- על ענף **שלכם** שאף אחד לא משך ממנו.
- כשהמטרה היא היסטוריה לינארית לפני פתיחת PR.
- אחרי `git fetch`, לא על בסיס מיושן.

## מתי לא

- על ענף משותף (`main`, `develop`) — שם rebase שובר את כולם.
- כשיש מישהו שעבד על הענף שלכם. במקרה הזה: `git merge`, וזהו.

## הקונפליקט הוא לא סוף העולם

```bash
git rebase origin/main
# ... CONFLICT ...
# עורכים את הקבצים
git add path/to/file
git rebase --continue
```

כל קונפיליקט חוזר על עצמו? `git rerere` זוכר את ההחלטות שלכם ומחיל אותן אוטומטית בפעם הבאה.

## איך יוצאים

```bash
git rebase --abort      # חזרה למצב לפני ה-rebase, בדיוק
git reflog              # כל המצבים שהיו לכם, גם אחרי rebase
git reset --hard HEAD@{3}
```

`reflog` הוא רשת הביטחון האמיתית. כל עוד לא הרצתם `git gc` אחרי שבוע, אפשר לחזור כמעט לכל מצב.

## ההרגל שמונע את כל הכאב

לפני כל rebase: `git branch backup/feature-login`. ענף גיבוי של שנייה, ואפס דרמה.

## rebase אינטראקטיבי — כשבאמת צריך

```bash
git rebase -i HEAD~3
```

כאן מסדרים קומיטים: `squash` לאחד, `reword` לתיקון הודעה, `drop` למחיקה. הכלל: קומיטים מסודרים נכתבים לפני פתיחת PR, לא אחרי שהתחילו ביקורת.
