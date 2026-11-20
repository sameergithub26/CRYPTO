# Crypto Quiz Battle

## Deploy online (Render.com, free, about 5 minutes)
1. Create a free GitHub account, make a new repository, upload ALL files from this folder (not node_modules).
2. On render.com sign up with GitHub > New > Blueprint > pick your repository > Apply.
3. When asked for HOST_PIN type a PIN only you know (e.g. 4829).
4. After the build finishes Render shows a URL like https://crypto-quiz-battle.onrender.com . That is your game link.
5. You: open the link > "Teacher login" at the bottom > enter your PIN. Students: open the same link.
Tip: the free plan sleeps when idle, so open the link 2 minutes before class to wake it up.

## Or run on classroom Wi-Fi
npm install, then HOST_PIN=1234 node server.js . Share the "Students" address it prints.

## Edit questions
questions.js (types: mcq, odd, num, match). Re-deploy (push to GitHub) or restart after editing.
