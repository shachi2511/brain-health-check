# Setup: installing Brain Health Check in your own Google Sheet

About 10 minutes. You need a Google account.

## 1. Create the Sheet
1. Go to [sheets.new](https://sheets.new) and name the Sheet **Brain Health Check**.
2. Click **Extensions → Apps Script**.
3. Delete the code that's already there.
4. Paste in everything from [`src/BrainHealthCheck.gs`](src/BrainHealthCheck.gs) and click the **Save** icon.
5. Close the Apps Script tab and **reload the Sheet**. After a few seconds, a **Brain Health Check** menu appears at the top and a **Start here** tab is added.

## 2. Try it on the practice folder (optional)
The [`demo-folder`](demo-folder) contains a fictional company's files with problems planted on purpose.

1. Download this repo (green **Code** button → **Download ZIP**) and unzip it.
2. In Google Drive: **New → Folder upload** → choose `demo-folder/Green_Harbor_Demo_Drive`.
3. In the **Sales** subfolder, right-click **GreenHarbor_Wholesale_Pricing_2026 FINAL (1)** → **Share** → General access: **Anyone with the link**. This plants the sharing problem.
4. Copy the link of the main **Green_Harbor_Demo_Drive** folder.

## 3. Run a scan
1. In the Sheet: **Brain Health Check → Scan a folder…**
2. First time only: **Continue** → choose your account → if you see "Google hasn't verified this app," click **Advanced → Go to Brain Health Check** → **Allow**. Then click **Scan a folder…** again.
3. Paste the folder link → **OK** → open the **Results** tab.

**Expected result for the practice folder (12 files):**
- 🔴 1 Fix now: the "FINAL (1)" pricing file (shared with anyone, and an old copy of the official one)
- 🟠 4 Tidy up: three versions of the inspection SOP (none marked OFFICIAL) and the 2025 pricing file
- 🟢 7 OK, including the OFFICIAL pricing file, marked ✅ "Official version"

## Settings
At the top of `BrainHealthCheck.gs`, `STALE_DAYS = 180` controls when a file counts as "not edited in a long time." Change it and save to adjust.
