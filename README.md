# Brain Health Check

**Try it:** [Open the live Google Sheet](https://docs.google.com/spreadsheets/d/10tF07cUHmcB6nPZ2wIb3puViNPiDPHWG8PbCw8S5FkE/edit?usp=sharing) (click **File → Make a copy** to get your own working copy) · **Setup:** [SETUP.md](SETUP.md) · **Code:** [src/BrainHealthCheck.gs](src/BrainHealthCheck.gs)

![Results tab after scanning the practice folder](screenshots/results.png)

---

**In one line:** a checkup for a Drive folder before our AI assistant is allowed to read it.

## What it does

When our AI assistant (Gemini Enterprise, "the Brain") reads a messy folder, it can quote an old price or show a private file to the wrong person. So before a folder is connected, it needs tidying. But nobody wants to open hundreds of files by hand to find the mess.

This tool does that for you. Give it a folder link, click one button, and it looks at every file and answers three questions:

1. **Is this file shared too widely?** For example, a price list anyone with the link can open. → 🔴 **Fix now**
2. **Are there several versions of the same thing?** For example, "Pricing 2025", "Pricing FINAL (1)" and "OFFICIAL Pricing". The AI can't tell which is right. → 🟠 **Tidy up** (it also tells you which one is marked official, or that none is)
3. **Has nobody touched it in 6+ months?** It might be out of date. → ⚪ **Check**

Files with no problems show as 🟢 **OK**. Next to each problem, it says in plain words what to do, like "change sharing to Restricted" or "move to the Archive folder."

**Example:** in a practice folder, it found three price lists (one of them an old copy that anyone with the link could open) and three versions of the inspection rulebook with none marked official. The old rulebook had an outdated rule in it, exactly the kind of thing that makes an AI give a wrong answer.

It **only reads** file names, dates and sharing settings. It never opens, changes, moves or deletes anything.

## How to use it

1. Open the Sheet and click the **Brain Health Check** menu at the top (next to Help).
2. Click **Scan a folder…**
3. Paste the link to a Drive folder (open the folder in Drive and copy the address bar). Click **OK**.
4. Open the **Results** tab. The summary at the top shows how many problems were found.
5. Fix the 🔴 rows first, then the 🟠 rows. Click any file name to open that file.
6. Run the scan again to check your fixes. Aim for a folder with no red or orange before it's connected to the Brain.

**First time only:** Google asks for permission to read your Drive. Click **Continue**, choose your account, then **Allow**. If you see "Google hasn't verified this app," click **Advanced** → **Go to Brain Health Check**. This appears because we built the tool ourselves.

**Opened a view-only link?** Click **File → Make a copy** to get your own working copy with the menu.

## When it breaks

| What you see | What to do |
|---|---|
| No "Brain Health Check" menu | Reload the page and wait a few seconds. On a view-only link, make a copy first (see above). |
| "That doesn't look like a Drive folder link" | You pasted a file link. Open the **folder** in Drive and copy that link instead. |
| "I couldn't open that folder" | You don't have access to it. Ask the folder's owner to share it with you. |
| A file is flagged as a duplicate but isn't | Its name looks like another file's. Rename one so the names are clearly different. |
| "Who can open it" says "Could not check" | Normal for some shared drive files. Check the sharing in Drive by hand. |
| Anything else | Send a screenshot to [your name] in Google Chat. |

## Good to know

- It spots duplicates **by name**, not by reading the contents. Two files with very different names but the same content won't be caught.
- "Not edited in 6+ months" is a hint, not a rule. Some files (like a policy) are fine to leave alone for years.
- Large folders (thousands of files) may take a minute or two.
