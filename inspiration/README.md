# UI Inspiration — retro "screens & time" life sim

> ⚠️ **REFERENCE ONLY — DO NOT COPY.** Everything in this folder is third-party, copyrighted
> material collected for **visual study only**. It is **not** licensed for reuse and must **not**
> be shipped, traced, or copied into the game. See [`NOTICE.md`](./NOTICE.md). We take inspiration
> from the _principles_ below, never from the pixels.

Reference art pulled for the direction we talked about: a **retro, screen-based UI** with a
few discrete "screens" (your **job**, your **apartment**, and **events** like visiting a
neighbor). Acting on a screen **spends time**; when the day's time runs out you have to go
home and sleep, and the loop restarts the next day.

Images in each folder are **official store screenshots / capsule art** pulled from Steam.
They are here for **mood, layout, and palette reference only** — do not ship them with the
game (see [Provenance & licensing](#provenance--licensing) at the bottom).

---

## The references at a glance

| Folder                       | Game                    | Why it's here                                                                                                                    |
| ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `01_papers-please`           | Papers, Please          | The core loop. Day timer, job screen, end-of-day summary, apartment side, documents-as-UI.                                       |
| `02_look-outside`            | Look Outside            | Retro top-down apartment building; diegetic objective box, portraits, status meters.                                             |
| `03_world-of-horror`         | WORLD OF HORROR         | 1-bit terminal look; **clock + date in the corner**, screens that visibly cost time, event log with timestamps.                  |
| `04_beholder`                | Beholder                | Hero of the "screens for job/apartment" idea: paper-textured forms, a clock, side icon menu, room grid, "42 h" time-cost labels. |
| `05_do-not-feed-the-monkeys` | Do Not Feed the Monkeys | Apartment + camera monitors + needs meters + `DAY 14` counter; CRT/Mac-style desktop frame.                                      |
| `06_not-tonight`             | Not Tonight             | Night-by-night job with a clipboard HUD, shift clock, score, and round counter.                                                  |

---

## What to steal from each

### 01 — Papers, Please `01_papers-please/`

The single closest match to the loop we want.

- **Day structure:** every day has a fixed time budget; the clock advances as you _do things_,
  not in real time. Running out ends the day.
- **Diegetic HUD:** date + clock top-left (`02.12.02`), rules binder, booth, and desk are all
  _in-world objects_, not floating UI.
- **End-of-day screen:** a summary of what the day cost (rent, food, heat, fines) with a
  consequence if you can't pay. This is the "go to bed and see the books" beat.
- **Palette:** desaturated olive/grey field, cream/parchment paper, one alarm red for stamps
  and errors. Flat, chunky, no gradients.
- **Type:** pixel font, uppercase, letterspaced headings on documents; stamps and rotations for
  emphasis instead of colour.
- **Layout idea:** documents are _physically dragged_ and stacked on the desk. The UI is the
  verb. `screenshot-05` shows permits/visas as distinct paper cards you layer.
- **Take:** a job screen where "doing the task" is manipulating a sheet, and time ticks while
  you do it.

### 02 — Look Outside `02_look-outside/`

The tone/art reference for an apartment building you actually walk around.

- **View:** top-down/isometric room framed by black borders; the room _is_ the screen.
- **Objective box:** a framed text panel pinned to the bottom of the screen that states the
  current goal ("Find a {Baseball Bat}.") with the key noun highlighted in cyan.
- **Status panel:** bottom-left portrait with labelled meters (`HP`, `STM`, `Ammo`) as short
  coloured bars — compact, readable, retro.
- **Dialogue:** floating coloured speech balloons anchored to characters, separate from the
  objective box.
- **Take:** one persistent objective panel + a small stat block, so each "screen" reads at a
  glance.

### 03 — WORLD OF HORROR `03_world-of-horror/`

Best example of a **retro terminal** that makes time explicit.

- **1-bit look:** pure black & white, halftone/dither fills, chunky bitmap type. Maximum retro
  with minimum art.
- **Clock + date:** `31 May 1984` and a live `[24:00]` clock pinned top-left — the day timer is
  always visible.
- **Time as a resource:** the event log timestamps everything (`[2:13:53] You are investigating
EXHAUSTED`), so "you did X, 3 minutes passed" is legible.
- **Screens as panels:** locations/rooms are drawn as bordered panels with numbered tags; the
  action row (`PREP / ATK / ATK`) is a menu of verbs.
- **Take:** a visible clock and a running log turn abstract "time cost" into something you feel.

### 04 — Beholder `04_beholder/`

The clearest "screens for managing things" layout.

- **Clock top-left** (`1 Sept.`), plus a task list with an explicit **time cost** (`42 h`) beside
  the objective — time cost is literally written on the task.
- **Room grid:** each apartment/room is a dark panel; you move between them.
- **Side icon rail:** a vertical strip of icon buttons (report, residents, camera/eye, profile)
  that swaps the main panel — this is the "different screens" pattern, verbatim.
- **Paper form UI:** the whole office screen is a **parchment form** on a dark background, with
  tabbed/stacked cards and an arrow "Back" button. Feels like paperwork on a desk.
- **Take:** one dark chrome + one parchment content pane, an icon rail to switch screens, and a
  visible cost on every action.

### 05 — Do Not Feed the Monkeys `05_do-not-feed-the-monkeys/`

The "apartment as a hub of little screens" reference.

- **Apartment hub:** you sit in a room; the _fridge_ (food), _bed_ (sleep), _door_ (leave) and
  _monitors_ (work) are objects you click.
- **CRT/Mac desktop frame:** the camera views are framed as a retro computer window with a
  title bar and close box, and a live clock (`03:35`) in the status bar.
- **Needs meters:** hunger/sleep/etc. as vertical bars on the fridge; `$` and day counter
  (`DAY 14`) always visible.
- **Take:** home screen = a room full of clickable objects; work screen = a framed monitor.

### 06 — Not Tonight `06_not-tonight/`

Good UI for a _shift_ job with rounds and a score.

- **Clipboard HUD:** a physical clipboard panel with a shift clock (`20:00 – 23:00`), a score
  readout (`PASS 5 / BONUS 1 15 / BONUS 2 20`) and a round counter (`1/3`).
- **Night framing:** each night is a self-contained shift; dialogue floats as a blue box.
- **Take:** if any job is score-based, show the running tally on an in-world clipboard.

---

## Distilled design rules for Hello Clarence

1. **Time is visible and diegetic.** A clock + date chip pinned in a corner (Papers, Please;
   World of Horror; Beholder). Every action writes a visible "-N min" and the day ends at a
   fixed hour.
2. **Screens, not menus.** Job / Apartment / Event are separate framed "screens" you switch
   between (Beholder's icon rail, Do Not Feed the Monkeys' room objects). Keep one persistent
   chrome (dark frame + stat rail) and one parchment/paper content pane.
3. **One restrained palette + one accent.** Muted olive/grey + parchment cream + a single alarm
   red. No gradients. Dither/halftone for shading (World of Horror).
4. **Pixel type, uppercase, letterspaced** headings; body text small and monospaced. Emphasis
   via highlights (Look Outside's cyan noun), stamps, or boxes — not colour soup.
5. **Actions show their cost before you commit** (Beholder's `42 h`). This is the whole game —
   make the price legible.
6. **End the day with a summary/ledger screen** (Papers, Please books) before bed, so the day's
   spending has weight.
7. **Home is a room of objects, work is a framed tool.** Fridge = eat, bed = wait/sleep, door =
   leave, desk/monitor = job.

### Suggested first screens

- **Apartment** (hub): bed, fridge, door, a "chores/errands" board listing time costs.
- **Job**: a single task tool (à la the stamp/desk), shift clock, score.
- **Events**: neighbor visits / outings as short framed scenes that cost time.
- **Day Summary → Sleep** → next day.

---

## Provenance & licensing

- All `*.jpg` files are **official Steam store screenshots and capsule images**, fetched via the
  public Steam store API by `_fetch.mjs` (see each folder's `notes.md` for appid, studio, and
  the store blurb).
- Copyright belongs to the respective developers/publishers (Lucas Pope; Francis Coulombe /
  Devolver Digital; panstasz / Ysbryd Games; Warm Lamp Games / Alawar; Fictiorama Studios;
  PanicBarn / No More Robots).
- **These are for internal reference and study only.** Do not redistribute them or ship them in
  the game build. Recreate the _patterns_, not the assets.
- To refresh or add a game: edit the `games` array in `_fetch.mjs` and run
  `node inspiration/_fetch.mjs`.
