---
title: SSH בלי סיסמאות: מפתחות בחמש דקות
excerpt: יצירת מפתח, העלאה לשרת, קובץ config שמקצר את החיים, ומה עושים כשמסרבים להתחבר.
tags: SSH, DevOps, אבטחה
level: Beginner
minutes: 2
published: 2026-10-14
category: devops
tracks: developer, engineer
access: free
---

## יצירת מפתח

```bash
ssh-keygen -t ed25519 -C "elad@laptop"
```

שני קבצים נוצרים: `~/.ssh/id_ed25519` (המפתח הפרטי — לא יוצא מהמחשב) ו-`~/.ssh/id_ed25519.pub` (הציבורי — זה שמוסרים).

## העלאה לשרת

```bash
ssh-copy-id user@server.example.com
# או ידנית:
cat ~/.ssh/id_ed25519.pub | ssh user@server 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

מכאן `ssh user@server` עובד בלי סיסמה. אם מבקשים עדיין סיסמה — הבעיה כמעט תמיד בהרשאות:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## קובץ config: החיים אחרי

```sshconfig
Host prod
  HostName 84.13.67.194
  User deploy
  IdentityFile ~/.ssh/id_ed25519
  ServerAliveInterval 30
```

מכאן: `ssh prod`, `scp file prod:/tmp/`. שם קצר במקום שורת פקודה שלמה.

## כשזה לא עובד — הסדר לבדוק

1. `ssh -v user@host` — הפלט מגלה באיזה שלב זה נופל.
2. `Permission denied (publickey)` — המפתח לא ב-`authorized_keys`, או שהרשאות התיקייה שגויות.
3. `Connection refused` — sshd לא רץ, או פורט אחר.
4. `Connection timed out` — firewall או כתובת שגויה.
5. `Host key verification failed` — המפתח של השרת השתנה. אם אתם יודעים שזה צפוי: `ssh-keygen -R host`.

## מה לא לעשות

- לא להעביר את המפתח הפרטי לשום מקום. אין "גיבוי" שלו בצ׳אט, במייל או ב-git.
- לא `chmod 777` על `.ssh`.
- לא להשבית סיסמאות לפני שאימתתם שהמפתח עובד בחלון SSH פתוח.
