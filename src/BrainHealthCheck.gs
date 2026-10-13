/**
 * BRAIN HEALTH CHECK
 * Scans a Google Drive folder and flags the files that would make an AI
 * assistant (like Gemini Enterprise) give wrong or unsafe answers:
 *   - files shared too widely
 *   - duplicate / look-alike files with no single OFFICIAL version
 *   - files nobody has touched in a long time
 *
 * Built for the Cloudasta Founders AI Associate take-home (Task 3).
 * Paste this into Extensions > Apps Script in a Google Sheet, save, reload the Sheet,
 * then use the "Brain Health Check" menu.
 */

var STALE_DAYS = 180;          // files not edited for this many days get a "check it's still current" note
var RESULTS_SHEET = 'Results';
var START_SHEET = 'Start here';

// Status levels, from best to worst. A file shows its worst problem.
var LEVELS = [
  { label: '🟢 OK',      color: '#e6f4ea' },
  { label: '⚪ Check',   color: '#f1f3f4' },
  { label: '🟠 Tidy up', color: '#fef0db' },
  { label: '🔴 Fix now', color: '#fce8e6' }
];

// Plain-English names for Drive's sharing settings.
var ACCESS_LABELS = {
  ANYONE: 'Anyone on the internet',
  ANYONE_WITH_LINK: 'Anyone with the link',
  DOMAIN: 'Everyone in the company',
  DOMAIN_WITH_LINK: 'Anyone in the company with the link',
  PRIVATE: 'Only people added by name',
  UNKNOWN: 'Could not check'
};

/** Adds the menu when the Sheet opens. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Brain Health Check')
    .addItem('Scan a folder…', 'scanFolder')
    .addItem('Clear results', 'clearResults')
    .addToUi();
  try { ensureStartSheet_(); } catch (e) { /* not critical */ }
}

/** Main action: asks for a folder link, scans it, writes the results. */
function scanFolder() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Brain Health Check',
    'Paste the link to the Google Drive folder you want to check:',
    ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  var folderId = extractFolderId_(resp.getResponseText());
  if (!folderId) {
    ui.alert('That doesn\'t look like a Drive folder link.\n\nOpen the folder in Google Drive, copy the link from the address bar, and try again.');
    return;
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(folderId);
    folder.getName(); // forces an access check
  } catch (e) {
    ui.alert('I couldn\'t open that folder.\n\nCheck the link is right and that you can open the folder yourself.');
    return;
  }

  var files = [];
  collectFiles_(folder, folder.getName(), files);
  if (files.length === 0) {
    ui.alert('That folder has no files in it.');
    return;
  }

  checkSharing_(files);
  checkDuplicates_(files);
  checkStale_(files);
  writeResults_(folder, files);
}

/** Empties the Results tab. */
function clearResults() {
  var sh = SpreadsheetApp.getActive().getSheetByName(RESULTS_SHEET);
  if (sh) sh.clear();
}

/* ---------- Reading the folder ---------- */

function extractFolderId_(text) {
  text = (text || '').trim();
  var m = text.match(/folders\/([a-zA-Z0-9_-]{10,})/) || text.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(text)) return text; // a bare folder ID also works
  return null;
}

function collectFiles_(folder, path, out) {
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    out.push({
      name: f.getName(),
      url: f.getUrl(),
      path: path,
      owner: getOwner_(f),
      updated: f.getLastUpdated(),
      access: getAccess_(f),
      problems: [],
      actions: [],
      level: 0,
      note: ''
    });
  }
  var subs = folder.getFolders();
  while (subs.hasNext()) {
    var s = subs.next();
    collectFiles_(s, path + ' / ' + s.getName(), out);
  }
}

function getOwner_(f) {
  try {
    var o = f.getOwner();
    return o ? o.getEmail() : 'Shared drive';
  } catch (e) {
    return 'Unknown';
  }
}

function getAccess_(f) {
  try {
    return String(f.getSharingAccess());
  } catch (e) {
    return 'UNKNOWN';
  }
}

function addProblem_(file, level, problem, action) {
  file.problems.push(problem);
  file.actions.push(action);
  if (level > file.level) file.level = level;
}

/* ---------- The three checks ---------- */

/** 1. Shared too widely: the security risk. */
function checkSharing_(files) {
  files.forEach(function (f) {
    if (f.access === 'ANYONE' || f.access === 'ANYONE_WITH_LINK') {
      addProblem_(f, 3, 'Anyone with the link can open this file',
        'Change sharing to "Restricted" and add only the people who need it');
    } else if (f.access === 'DOMAIN' || f.access === 'DOMAIN_WITH_LINK') {
      addProblem_(f, 1, 'Everyone at the company can open this file',
        'Check that\'s OK for what\'s inside (e.g. pricing or client files)');
    }
  });
}

/** 2. Look-alike files: the "which version is right?" problem. */
function checkDuplicates_(files) {
  var groups = {};
  files.forEach(function (f) {
    var key = normalizeName_(f.name) || f.name.toLowerCase();
    (groups[key] = groups[key] || []).push(f);
  });

  Object.keys(groups).forEach(function (key) {
    var group = groups[key];
    if (group.length < 2) return;
    var official = group.filter(function (f) { return /official/i.test(f.name); });
    var others = group.length - 1;

    group.forEach(function (f) {
      if (official.length === 1 && official[0] === f) {
        f.note = '✅ Official version (' + others + ' look-alike file' + (others > 1 ? 's' : '') + ' found)';
      } else if (official.length === 1) {
        addProblem_(f, 2, 'Older or duplicate copy of "' + official[0].name + '"',
          'Move to the Archive folder so the AI only reads the official version');
      } else if (official.length > 1) {
        addProblem_(f, 2, 'More than one look-alike file is marked OFFICIAL',
          'Owner keeps one official version and archives the rest');
      } else {
        addProblem_(f, 2, 'One of ' + group.length + ' look-alike files, none marked OFFICIAL',
          'Owner picks the correct one, renames it "OFFICIAL – …", and archives the rest');
      }
    });
  });
}

/**
 * Turns "Copy of Pricing_2026 FINAL (1).csv" and "OFFICIAL - Pricing 2025"
 * into the same key ("pricing"), so look-alike files group together.
 */
function normalizeName_(name) {
  var n = String(name).toLowerCase();
  n = n.replace(/\.[a-z0-9]{2,5}$/, '');                  // file extension
  n = n.replace(/[_\-–—.]+/g, ' ');                        // separators to spaces
  n = n.replace(/^\s*copy of\s+/, ' ');                    // "Copy of …"
  n = n.replace(/\(\d+\)/g, ' ');                          // "(1)", "(2)"
  n = n.replace(/\b(official|final|draft|old|new|latest|copy|updated|current)\b/g, ' ');
  n = n.replace(/\bv\d+\b/g, ' ');                         // v2, v3
  n = n.replace(/\b(19|20)\d{2}\b/g, ' ');                 // years
  n = n.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(uary|ruary|ch|il|e|y|ust|tember|ober|ember)?\d{0,2}\b/g, ' '); // months like "Oct9"
  n = n.replace(/[^a-z0-9]+/g, ' ').trim();
  return n;
}

/** 3. Not touched in a long time: possibly out of date. */
function checkStale_(files) {
  var cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  files.forEach(function (f) {
    if (f.updated < cutoff) {
      addProblem_(f, 1, 'Not edited in over ' + Math.round(STALE_DAYS / 30) + ' months',
        'Ask the owner if it\'s still current; archive it if not');
    }
  });
}

/* ---------- Writing the results ---------- */

function writeResults_(folder, files) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(RESULTS_SHEET) || ss.insertSheet(RESULTS_SHEET);
  sh.clear();
  var tz = ss.getSpreadsheetTimeZone();

  files.sort(function (a, b) { return (b.level - a.level) || a.name.localeCompare(b.name); });
  var counts = [0, 0, 0, 0];
  files.forEach(function (f) { counts[f.level]++; });

  sh.getRange('A1').setValue('Brain Health Check').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('Folder: ' + folder.getName() +
    '   ·   Scanned ' + Utilities.formatDate(new Date(), tz, 'MMM d, yyyy h:mm a') +
    '   ·   ' + files.length + ' files checked');
  sh.getRange('A3').setValue('🔴 Fix now: ' + counts[3] + '     🟠 Tidy up: ' + counts[2] +
    '     ⚪ Check: ' + counts[1] + '     🟢 OK: ' + counts[0]).setFontWeight('bold');

  var header = ['Status', 'File', 'Folder', 'What we found', 'What to do', 'Owner', 'Last edited', 'Who can open it'];
  sh.getRange(5, 1, 1, header.length).setValues([header])
    .setFontWeight('bold').setBackground('#202124').setFontColor('#ffffff');

  var rows = files.map(function (f) {
    return [
      LEVELS[f.level].label,
      f.name,
      f.path,
      f.problems.length ? f.problems.join('\n') : (f.note || 'No problems found'),
      f.actions.length ? f.actions.join('\n') : '—',
      f.owner,
      Utilities.formatDate(f.updated, tz, 'MMM d, yyyy'),
      ACCESS_LABELS[f.access] || f.access
    ];
  });

  var body = sh.getRange(6, 1, rows.length, header.length);
  body.setValues(rows).setWrap(true).setVerticalAlignment('top');
  body.setBackgrounds(files.map(function (f) {
    var c = LEVELS[f.level].color;
    return header.map(function () { return c; });
  }));

  // Make each file name a clickable link to the file.
  sh.getRange(6, 2, rows.length, 1).setFormulas(files.map(function (f) {
    return ['=HYPERLINK("' + f.url + '","' + f.name.replace(/"/g, '""') + '")'];
  }));

  sh.setFrozenRows(5);
  [110, 280, 200, 300, 320, 200, 110, 190].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  ss.setActiveSheet(sh);
}

/** Creates a simple "Start here" tab with instructions, if it doesn't exist yet. */
function ensureStartSheet_() {
  var ss = SpreadsheetApp.getActive();
  if (ss.getSheetByName(START_SHEET)) return;
  var sh = ss.insertSheet(START_SHEET, 0);
  sh.getRange('A1:A9').setValues([
    ['Brain Health Check'],
    ['Finds the files that would make our AI assistant give wrong or unsafe answers.'],
    [''],
    ['How to use it'],
    ['1. Click the "Brain Health Check" menu at the top, then "Scan a folder…".'],
    ['2. Paste the link to a Google Drive folder and click OK.'],
    ['3. Open the "Results" tab. Fix the 🔴 rows first, then the 🟠 rows.'],
    [''],
    ['First time only: Google asks for permission to read your Drive. Click "Continue" and "Allow". It only reads file names, dates and sharing settings, and changes nothing.']
  ]);
  sh.getRange('A1').setFontSize(16).setFontWeight('bold');
  sh.getRange('A4').setFontWeight('bold');
  sh.setColumnWidth(1, 720);
  sh.getRange('A1:A9').setWrap(true);
}
