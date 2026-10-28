---
title: Progress log
type: log
status: active
owner: Prem
updated: 2026-10-26
summary: Append-only record of meaningful work, what was verified, and what is left, newest first.
tags: [area/docs, kind/process]
related: [TASKS.md, PROJECT_STATE.md]
---
# Progress log

Newest first. Add an entry after meaningful work: what changed, the evidence, and any risk left. Do not rewrite old entries; correct them with a new one.

## 2026-10-28 One heading-style switch; Contact title switch
A single Design system switch ("Editorial headings", off) now decides how every title and section heading reads: body size by default (titles, the About intro, How I work / Experience / Side projects labels, blog headings, footer and section headings) or editorial (large titles, small-caps labels). All headings read shared tokens, so a new heading follows the switch with no setting of its own. The article-only "title body size" switch was removed. Contact gained a "show title" switch (off): the title hides and its text starts where it was. Evidence: computed font sizes of every heading in both modes in the headless browser; tests/header-spacing.mjs and tests/articles.mjs updated.

## 2026-10-28 Experience and Side projects as two switches
"Experience & side projects" was one switch; it is now "Experience" and "Side projects & R&D" in both Content Home and Content About (new section id `side-projects`, on by default on Home and off on About like the other Home components). Someone who had hidden the old combined section keeps both hidden until they choose otherwise. The width setting still applies to the pair. Evidence: tests/content-widths.mjs (defaults, migration, hiding one leaves the other, width); headless browser checked each switch on Home.

## 2026-10-28 Hover thumbnail left behind on the project page
Clicking an Experience or Side Projects row on Home leaves a card-shaped stand-in for the hover thumbnail (`.preview-morph-proxy`) on the page. The simple page transition cleared its reference without removing the element, so the thumbnail stayed on the project page for good. It now removes it. Evidence: headless browser reproduced it (the proxy still at full opacity 4.5s after the route settled) and confirmed it gone after the fix; tests/simple-transitions.mjs asserts it.

## 2026-10-28 Header Go Back and arrows plain like the carousel arrows
With Plain navigation on, Go Back and Previous/Next in the header now behave like the carousel arrows: muted text at rest, full ink on hover and no glass background (they showed the glass hover before because they were not in the Plain navigation rules). With it off they keep the glass hover. Evidence: computed colours and backgrounds on hover in the headless browser, both modes.

## 2026-10-27 Chat welcome follows the page pattern
The chat welcome text is now just "I’m Prem’s custom-built assistant."; the title is in full ink; title and text are a half-width block (bounded by the chat column); in the composer-dock chat the welcome starts at the content start (165px) instead of being centred vertically. The menu-dock chat keeps the mascot stage. Evidence: headless browser in both chat modes: title top, widths and colour measured; tests/assistant-floating.mjs extended.

## 2026-10-27 Body-size headings in the About block and the blog
The Home and About intro heading ("Most useful where…") is body size and its text a half-width block; "How I work", "Experience" and "Side Projects & R&D" are body text in full ink instead of eyebrows ("HOW I WORK" is now "How I work" in both catalogs). In blog posts the series line is the first line of the text at paragraph size, and the section headings are reading-size text in full ink. Evidence: computed styles in the headless browser: all 13.12px, labels lightness 0.97, intro heading 662px and text 648px wide on a 1325px rail; article series and headings measured. tests/articles.mjs and tests/header-spacing.mjs extended.

## 2026-10-27 Carousel arrows above right, tighter gap
The home carousel arrows moved from under the carousel (centred) to above it, right-aligned to the content edge, and the empty space below the captions was removed; the section after the carousel now sits one medium rhythm step below instead of a large one. Evidence: headless browser at 1440px: arrows at the content right edge above the cards; carousel bottom to the next section down from 192px plus 45px blank to 96px plus 19px. tests/card-gallery.mjs extended.

## 2026-10-27 Half-width intro block, menu right-aligned
Titles and text now share one block width on every page: half the content width (was about a third on Home, 40-45% elsewhere): `--page-intro-width`. With the nav on top the menu dock is right-aligned to the content edge and is the rightmost container; the character hangs off its left side and the Assistant button sits left of it. Evidence: headless browser with the owner's settings: title and text widths 662/648 (Home), 600/600 (About, Contact), 662/662 (Lab) against half the rail; dock right edge on the header content edge at several widths. tests/agent-world.mjs updated.

## 2026-10-27 Title strength, blog header
Card titles and the project page caption title are now the strongest text (card title rest strength 100%, caption in full ink); the results line stays quieter. Blog articles: the title is at the page content start, top left, then the date without the author, then the series line; the text stays centred in its column. New setting "Article title: body text size" (off). Evidence: computed colours and positions in the headless browser; tests/articles.mjs extended.

## 2026-10-27 Quieter menu links
Idle menu links and the current page both dropped a step in tone (new tokens `--nav-link-ink`, `--nav-link-active-ink`), in the glass menu and Plain navigation; hover is unchanged. Evidence: computed lightness in the browser, dark theme: idle 0.58, current 0.80, hover and hover-on-current 0.94, in both menu styles. tests/header-spacing.mjs extended.

## 2026-10-27 Quieter role line
"Product designer & builder" under the name now uses the eyebrow tone instead of the muted text tone, so it sits one step quieter than "Prem Luczak". Evidence: computed colours compared in the browser (dark theme).

## 2026-10-27 Details title beside image: caption, wide image, text below
With the setting on, a project page now shows a short caption (client. short category, then the results line) above the image across the whole page, with the client, long title, summary and facts in a reading-width column below. It used to put the text in a left column beside the image. Evidence: headless browser on Merlin and Bastion (portrait) with the setting on and off; live switching checked.

## 2026-10-27 About heading switch
Content About gained a "Heading" switch (on): off hides only "Hello, I'm Prem"; the intro text and portrait stay and the text moves up to where the heading was. It is one of About's own sections (`title`), so it sits with Intro and portrait, Traits and Unusual things. Evidence: tests/about-page.mjs; headless browser: text top equals the heading top when hidden.

## 2026-10-27 One title-then-text position, no Contact eyebrow
The Lab switch is now "show title": off hides only the title and its text stays, starting where the title did. Contact lost its "Let's connect" eyebrow and got About's title-then-text rhythm. Evidence: headless browser with the owner's settings: Work, About, Lab and Contact all have the title at 165px, text 29px below it at 13.12px in the same colour (Contact's text sits lower only because its title is two lines). tests/lab-page.mjs extended.

## 2026-10-27 Lab show-heading switch
New Lab setting "show heading" (on; saved and exported): off hides "Experiments" and its line, and the grid starts at the shared content start. Evidence: headless browser: grid top equals the heading top when it is hidden; no heading in the layout.

## 2026-10-27 Lab grid full width
New Lab setting "grid full width" (off by default, saved and exported): the grid spans the app canvas less the gutters, capped by the app maximum (1920px), instead of the content rail. Evidence: headless browser at 1440, 1920 and 2560px: grid width with the option off (rail) and on (viewport less gutters, never above 1792px of 1920).

## 2026-10-27 Staggered header swap, tighter card copy
The header swap is now staggered and slides like the old dock Back and arrows: avatar, then name, slide left and fade out, then Go Back, Previous, Next slide in from the right; leaving reverses it. Previous/Next no longer snap in from display:none. Card results now follow the title at regular line spacing (the 9.6px title-to-eyebrow margin is gone on cards). Evidence: headless browser frame timing: in 27, 87, 144, 209, 268ms; out 78, 139, 205, 269, 311ms; card title-to-results gap 0 beyond line height. tests/header-spacing.mjs updated.

## 2026-10-27 Header swap on detail pages, body-size menu
With the nav on top, project and article pages fade the avatar, name and role out of the header while Go Back and Previous/Next fade in at the same spot (articles: Go Back only); the dock no longer repeats Back or the side arrows there. Menu links are now body text like the name (were 12px with label tracking); footer text and writing titles were already body text. Evidence: headless browser with the owner's settings: mid-transition opacities 0.07 (name) and 0.93 (controls), Go Back text on the avatar's 58px edge, Next and Go Back work, articles show Go Back only, bottom nav unchanged with the dock Back pill; menu 13.12px. tests/header-spacing.mjs extended.

## 2026-10-27 Extra small back to 960px
The 740px change was reverted the same day at the owner's request: `CONTENT_WIDTHS.xsmall`, `--content-width-xs`, the dropdown labels, docs and test are back to 960px. Evidence: tests/content-widths.mjs passes.

## 2026-10-27 Extra small is 740px
Extra small page width changed from 960px to 740px (`CONTENT_WIDTHS.xsmall`, `--content-width-xs`, the four dropdown labels, docs and test). Saved choices keep the name, so anyone on Extra small gets 740px. Evidence: tests/content-widths.mjs.

## 2026-10-27 Chat width dropdown
The chat page has its own width dropdown with the other page widths (Default, Extra small 960, Small 1200, Medium 1440, Large 1760), saved and exported. Default leaves the chat as it was. Evidence: headless browser measured the chat column and, in the menu-dock chat, the composer pill at each width; tests/content-widths.mjs extended.

## 2026-10-27 Nav mode and contextual placement separated
Navigation is now Composer or Classic nav, and Contextual actions (Above the dock / Within the page) applies to both, instead of "In composer" also forcing the composer. Previous/Next and Go Back stay with the nav mode. Within the page, project pages gained View prototype and Watch buttons beside Full screen, and carousels keep their own View project controls. Stored values are unchanged (`composer` = above, `inline` = within the page), so older settings files still import. Evidence: headless browser on Merlin and the home carousel for all four combinations; composer-context, assistant-floating and settings-transfer tests updated.

## 2026-10-27 Menu links in the composer's rhythm
With the owner's 13px item padding and the Lab link, the menu needed 264px in a fixed 252px dock, so Contact ran 11.5px past the edge, and the links touched the dock's left edge. The dock now sizes to its links, links sit in the composer's 6px inset at its 36px button height, and the selected and hovered links use the composer buttons' glass. Evidence: headless browser with the owner's settings: every link inside the dock with equal insets matching the composer buttons, selected pill 36px tall.

## 2026-10-27 One dock glass for menu and composer
The menu dock wore the Assistant button's lighter glass while the composer dock wore the dark dock glass. The menu override is gone, so both modes share the composer's glass. Evidence: headless browser compared the dock glass in both modes (fill, blur, outline, shadow, height).

## 2026-10-27 Chat page in menu-dock mode
With the menu in the dock, opening the chat page no longer swaps the menu for the composer: Work, Lab, About and Contact stay, and the composer sits in the page under the welcome as a glass pill that follows the conversation and sticks to the bottom (setting "Chat page: composer under the welcome", on). A mascot stage above the welcome takes the character, larger (that part lives in the uncommitted agent code). Evidence: headless browser with the owner's settings: nav items visible on #assistant, composer under the suggestions and centred, asking a question works, leaving the page returns the composer to the dock. Tests updated.

## 2026-10-27 Lab images-only gaps
With card details hidden on the Lab, the space between rows was about 83px against a 38px column gap: the image kept its 28px top and 8px bottom insets and the 38px caption margin. Those are now zero there, so the image fills the card. Evidence: headless browser with the owner's 2026-10-27 settings at 1755px: picture-to-picture gap 38px across and down; Work unchanged.

## 2026-10-27 Lab heading in About's structure
Removed the "Work in progress" eyebrow. The Lab heading is now About's structure, a title then `.info-body` text, sharing About's rules in about-page.css. Evidence: headless browser: Lab and About title and body text match in position, gap, size, weight, line height and colour.

## 2026-10-27 Lab as a content page
The Lab no longer shows the home hero and home sections around its grid. It opens with its own heading like About and Contact: "Experiments", eyebrow "Work in progress", and "Prototypes, R&D and projects that never made it to market." (`lab-page.js`), then the card grid. Evidence: headless browser: heading at the shared content start, grid directly below, no hero or sections; Work unchanged after visiting the Lab. tests/lab-page.mjs extended.

## 2026-10-27 Featured-cards switch, Lab settings, portrait fit
Work and Lab rendered differently because Work used the saved masonry grid (six featured cards two columns wide, all stacked on the left) and Lab a fixed regular grid (rows as tall as the portrait card). Added the global "Featured cards larger (masonry)" switch (on), and a Lab section in the dev settings (`lab-settings.js`: masonry, 4 columns, featured not larger, card details on) that overrides the global card settings on the Lab only; "show card details" off gives an images-only grid. The portrait image is now capped to its masonry card (it spilled 8px, 180px with details hidden). Evidence: headless browser at 1515px: Work 4,704px tall with the switch on and 1,224px with it off; Lab masonry 1,224px with Bastion one column, two rows and the others wrapped; zero overlaps and zero image spill in all four cases; Work keeps its copy after visiting a details-hidden Lab. tests/lab-settings.mjs added; lab-page and card-return-lifecycle updated.

## 2026-10-27 Article reading column
Blog articles now span the content page width with text in a centred 600px reading column (`--content-width-reading`), and a new Article images setting (Text width default, or Page width) decides whether images and video match the text or span the page. Evidence: headless browser with the About / content page width at Extra small: article 960px, paragraphs 600px centred; an injected image section was 600px, then 960px with Page width; tests/content-widths.mjs extended. Risk: no article has images yet, so Page width was checked with an injected block.

## 2026-10-27 Extra small page width
Added Extra small · 960px to the Home, About / content page and Project details width dropdowns (`CONTENT_WIDTHS.xsmall`, CSS twin `--content-width-xs`). Blog articles were 66ch wide (543px at 1440px), so they now read at the 960px width. Evidence: tests/content-widths.mjs covers the rail, the CSS twin, the article rule and the three options; headless browser measured the article and the Extra small rail.

## 2026-10-27 No Back pill on About and Contact
With the menu visible in the dock, About and Contact no longer pull a Go Back pill out of the dock and back (the dock keeps its shape); Back remains for projects and the assistant. Evidence: headless browser: dock width and Back state unchanged between Work and About. tests/lab-page.mjs asserts the rule.

## 2026-10-27 Landing ripple switched off
Only the instant click ring runs when choosing Lab; the second ring on landing is kept behind `LAB_RIPPLE.landing` (false). Evidence: tests/lab-page.mjs asserts the flag and the guarded call; headless browser showed the ring class only around the click.

## 2026-10-27 Lab ripple also answers the click
Choosing Lab now starts a short ring (to the handoff point) instantly, not awaited, so the fade out and in are not delayed; the full ring still lands once the Lab has faded in. Evidence: headless browser sampled frames: ring class on from the click, page fade unchanged, second ring after the fade-in. Risk: with the slow-motion setting the two rings could overlap; the landing ring then replaces the first.

## 2026-10-27 Lab after Work, ripple on landing
Lab now sits right after Work in the dock and after Home in the site menu. The ripple no longer fires on the click: the old page fades out, the Lab fades in, and then one ring runs across it (`createLabRipple().play()`); leaving the Lab is the ordinary fade. Evidence: headless browser measured the ring starting only after the Lab had finished fading in; dock order Work, Lab, About, Contact. Risk: `LAB_RIPPLE.handoff` is now unused.

## 2026-10-27 Lab as an in-app route
Clicking Lab ran the ripple and then loaded a whole new page (about 170 module requests plus the catalog), so the browser loader showed after the ripple. The Lab is now the route `#lab`: the home cards through `HomeLayout` with `LAB_VIEW` (regular, four columns), always entered through the simple page transition with the ripple playing over the swap; `lab.html` only redirects (ADR-011, REQ-011 dropped, command `route.lab`, site menu button). Evidence: headless browser: no document or script requests during the switch; Lab shows 9 cards on 4 columns with the Lab dock item active; Work restores the carousel; About, Contact and Lab again work in sequence; a card opens a project and Escape returns to the Lab; lab.html lands on #lab; no page errors. Tests: lab-page rewritten, six mirrored-page tests now check index.html only, card-return-lifecycle fixture given the Lab helpers. Risks: opening a project from the Lab fades instead of morphing; the first-half ripple duration (about 0.6 s) is unchanged; an old `data-page-product-display` attribute reader remains in app.js unused by any page.

## 2026-10-27 Lab back in the menu, as a card grid
Un-hid the Lab links (dock and site menu) and gave `lab.html` its own page attributes (`data-page-columns="4"`, `data-page-layout="regular"`) so it shows a four-column grid of the same project cards. Evidence: headless browser: index dock shows Lab, lab.html lays 9 cards on 4 left edges (58, 403, 748, 1093) and the saved Columns choice stays 2; Lab is active in its own dock. tests/lab-page.mjs extended. Risk: "regular" rows follow the tallest card, so the portrait Bastion card leaves a gap in the first row; the Lab hero is still the home hero.

## 2026-10-27 Assistant sidebar
New "Assistant opens as → Sidebar" option: the conversation docks to the right, the page and header are pushed aside and the composer sits at the sidebar's foot. Evidence: headless browser at 1440x900 showed the sidebar at x 1008-1440, main 0-1008, header 0-1008, composer 393px wide inside the sidebar, Escape restoring the dock; tests/assistant-floating.mjs extended. Risks: the dock-morph composer cap now reads `--composer-max-width` (was a hard-coded 520); the agent character still homes at the dock and so sits over the sidebar; mobile widths not yet designed.

## 2026-10-27 Shared content start for About and project detail
About and the project detail now start at the same height as the home hero (`--page-content-top`, one token used by all three) and the detail no longer has side padding, so its text lines up with the header logo and the hero (x 58 at 1440px). Evidence: headless browser at 1440x900: first content at y 165 on home, About and Merlin; detail text left edge 58 (was 110); tests/header-spacing.mjs updated.

## 2026-10-27 Content column start
Added "Content starts in the first column" (off by default, saved and exported, both pages). The eleven home placements that skipped the first column now read `--content-column-start`. Evidence: headless browser with every home section on: off, all content at x 509; on, all at x 58 with unchanged widths and no heading overlaps; persists across reload. tests/hero-timeline.mjs and tests/card-gallery.mjs updated for the token.

## 2026-10-27 Character as the assistant button
In menu-dock mode the index and Assistant buttons are hidden and the dock character opens the assistant (setting "Character opens the assistant", on, saved and exported, both pages). Evidence: headless browser showed launcher and index hidden, character focusable with pointer events, a click opened the floating assistant, and turning the setting off restored both buttons; tests/assistant-floating.mjs updated. Risk: uncommitted, because it depends on the owner's uncommitted agent work; the site index is still reachable by keyboard shortcut and command, not by a dock button.

## 2026-10-27 Simple scroll carousel
The home carousel gained a Scroll presentation, now the default: free native scrolling with no snap or tilt, starts on the content edge, each card carries its own caption, and clicking any card opens its detail instead of bringing it to the front. Perspective and Circular stay selectable (Presentation select). Evidence: tests/card-gallery.mjs covers it; headless browser showed scroll positions held after scrolling (437 stays 437, wheel +260 lands at 697), first card at the content edge, and a click on a side card opened its detail. Risk: a saved Circular/Perspective choice still wins, so existing browsers must pick Scroll once.

## 2026-10-27 Card title size
Card titles now use the summary line size (`--font-size-project-summary`), so title and result match at 14px / 22.4px; weights stay 500 and 300.

## 2026-10-27 Short category and card text switch
Added optional `shortCategory` to projects (owner's seven phrases in both catalogs; Porter and Gala DeFi have none and fall back to `name`) and a Cards setting "Show category instead of title" (off by default, saved and exported, on both pages). Evidence: tests/card-category.mjs passes; headless browser on the carousel showed all nine captions swap to the category, keep the inline client, persist across reload and switch back. Risk: Porter and Gala DeFi need a phrase from the owner.

## 2026-10-27 Role size and carousel lift
The role line now has the same size as the name (no size of its own). The empty-hero carousel was centred by its box, but the box has empty space above the cards while captions and arrows hang below, so the visible content sat 23px low; a bottom padding of twice `--empty-hero-lift` now centres the visible content and lifts it slightly: 22px above the middle on desktop and phone. tests/header-spacing.mjs updated.

## 2026-10-27 Header spacing, role line and empty-hero centring
The header (logo, name, top navigation) now sits lower by a shared `--header-top-offset`, which also lowers `--dock-top` and the hero's start; the name has `Product designer & builder` under it; and with no visible hero content the carousel is centred below the header instead of floating under an invisible hero. Evidence: tests/header-spacing.mjs passes; in a browser the header was 144px (was 112px), the agent orb stayed level with the nav, and the carousel card sat at the exact vertical centre of the space below the header on desktop (522px) and phone (477px). The agent orb is the owner's uncommitted feature; it followed the nav without any change to it. A first check missed the carousel's header margin (it started at y=0), fixed.

## 2026-10-27 Masonry test conflict resolved
TASK-001: tests/masonry-placement.mjs failed because Bastion is both portrait and featured, and the planner's two rules (featured on the left, portrait on the right) disagree for such a card. Chose to keep the live layout (featured wins, ADR-010) and narrowed the test's portrait rule to non-featured cards; the planner is unchanged. Evidence: the test passes. If the owner wants a featured portrait card on the right, the note in ADR-010 says what to change.

## 2026-10-27 Plain cards
Added Settings → Cards → Plain cards (default off). Measured first: with Card background off a card still showed the skin gradient, `.material-reflection` and `.image-edge` (the inner glow), so the existing switch was not enough. The new mode removes those layers, shadows, borders, blur, the hover-effect layer and the note-card panels while leaving images and layout alone. Evidence: tests/plain-cards.mjs passes; in a browser the three layers disappeared, the image stayed 323px wide, note cards and the detail card were plain, and no errors.

## 2026-10-27 Plain navigation
Added Settings → Navigation → Plain navigation (default off): the dock and the buttons lose their glass, borders, shadows and blur and read as text links, with the active page underlined; the composer is exempt. Evidence: tests/plain-nav.mjs passes; in a browser on desktop and phone the dock glass and outline were removed, links, the menu button, the launcher and the corner buttons were transparent, and the setting persisted across a reload. My dev server had loaded its stylesheet list before the new file existed, so the first check showed no effect until I restarted it (FACT-009).

## 2026-10-26 Phone carousel and spacing
On a 390px phone the home carousel card was 239px wide: the saved Carousel size (70%, the minimum) scaled the card down. At 600px and below the size is now floored at full width, margins shrink (48px to 32px) and the card gap halves (48px to 24px), and the hero and overview gaps tighten. Measured in a mobile viewport: card 239px to 358px wide, carousel 77px higher. tests/mobile-carousel.mjs added. Desktop is unchanged.

## 2026-10-26 At a glance type
Owner asked to move the At a glance columns off mono: the three titles (Recently, Experience, Writing) are now `.text-eyebrow` and the items are ordinary sentence-case body text. Assumed "just titles" meant the titles become eyebrows; items back to mono is a one-class revert. Measured in a browser.

## 2026-10-26 Note cards made subtler
Owner asked for less gap and super-subtle cards: the gap between note cards went from 24px to 12px (`--note-cards-gap`) and the fill from 4% to 1.5% of the text colour (`--note-card-fill`). Measured 14px gaps and the new fill in a browser.

## 2026-10-26 Footer switch
Added Settings → Content → Show footer (default on). The app re-showed the footer on every route change, so that line now follows the switch. Evidence: tests/footer-switch.mjs passes; in a browser the footer hid, stayed hidden through About and a project, survived a reload, and returned when switched back on.

## 2026-10-26 Freshness check made reliable
The image freshness module cache-busted its import of image-variants.js with `Date.now()` alone, so two reads in the same millisecond could return a stale module and tests/image-freshness.mjs failed intermittently (about 1 run in 3 under load). It now adds a counter; 25 of 25 runs pass. Found while running the full suite for the heading switch.

## 2026-10-26 Hero heading switch
Added a Content Home switch for the hero h1 (default on), applying to the Current layout only because Flip and Flat reuse the h1 for the active project. Evidence: tests/hero-heading-switch.mjs passes; in a browser the heading hid in Current and stayed in Flat and Flip, and the choice persisted across a reload. A first attempt failed in Flat because an `!important` hidden rule beat the override, fixed by exempting the heading in that rule.

## 2026-10-26 Available badge switch
Added a Content Home switch for the hero's Available badge, on by default so the live site is unchanged. Evidence: tests/badge.mjs extended and passing; in a browser it showed by default, hid when switched off and stayed hidden after a reload.

## 2026-10-26 Note cards under featured projects
Each project now has `homeCards` and `detailCards` (one shared card structure: media, optional title and description), validated and projected with resolved media; three placeholder home cards on each project's cover image render under every staged project, with the backdrop confined to the first row (ADR-009, REQ-016). Evidence: tests/note-cards.mjs passes; measured in a browser. Two lessons recorded: a stale dev server rejected the new schema (FACT-009), and an absolutely positioned grid child needs both row lines (FACT-010). Left: the detail page does not render `detailCards` yet (TASK-015) and the cards hold placeholders (TASK-016).

## 2026-10-26 Eyebrow text role
Added a global `.text-eyebrow` role (caption size, light weight, label tracking, eyebrow ink, uppercase) and used it for the detail-page fact labels and the card tag row, replacing the tags' mono styling. Evidence: computed label styles identical before and after in light and dark; tests/card-details.mjs extended. The request's last line was cut off, so any further uses are open.

## 2026-10-26 Card details layout
Questions Q-001 to Q-003 resolved by the owner (status shown on cards; Lab page not linked yet; Available badge stays). Added two Cards settings: **Client above the title** (wide-tracked capitals, wins over Inline) and **Card details** (status pill, gradient results line, discipline tag row), plus a `disciplines` field per project, a reusable `.text-gradient` class shared with the About page, and `card-details.css` (ADR-008). Evidence: tests/card-details.mjs passes; in a browser the copy stacks status, client, title, results, tags, defaults leave the layout unchanged, Above wins over Inline, and the About highlight still renders its gradient. Committed as c6eea1b, 93f19e3 and b91f2eb; a clean worktree of the first caught that it had committed only half of a tokens.css change and a mismatched site.css, fixed by the next two (FACT-008). Left: the discipline tags other than Tracr's are drafts (TASK-013); the status reads Launched where the mockup says Shipped.

## 2026-10-26 Memory is maintained as Markdown only
The owner decided not to register the memory MCP server; memory is kept current by updating TASKS, PROGRESS, PROJECT_STATE and the docs after meaningful work (the habit in AGENTS.md). TASK-012 was dropped. The server and its test stay in the repository, unregistered.

## 2026-10-26 Memory MCP server and commits
Built a read-only project memory MCP server (`scripts/memory-mcp.mjs`, four tools, no dependency, not registered; ADR-007, TASK-009). Committed the work as 83dbce2 (memory structure), 17fc2ba (image checks) and 1ee57a1 (regenerated content exports), leaving the owner's `agent*` feature uncommitted (TASK-008). Evidence: tests/memory-mcp.mjs passes, including a real stdio session; a clean worktree of HEAD passes `build-content --check`, `check-images` and `memory check`. The clean-worktree check caught that `dist/content/` exports had not been committed with the catalog change, which the third commit fixed. Left: registering the server with a client (TASK-012).

## 2026-10-26 Project memory structure
Added AGENTS.md, CLAUDE.md, PROJECT_STATE.md, this log, TASKS.md and docs/ (constitution, requirements, facts, six decisions), plus `scripts/memory*.mjs` to index, search and validate them. Evidence: `node scripts/memory.mjs check` and tests/project-memory.mjs pass (TASK-010). Left: an MCP interface is proposed only, not installed (TASK-009).

## 2026-10-26 Image pipeline and freshness check
`npm run images` runs the thumbnail and backdrop generators; each records the original's SHA-1, and `npm run check:images` (run first by build and check) fails on any mismatch. Evidence: tests/image-freshness.mjs passes; a changed original made the build stop with exit 1 (TASK-011, ADR-001). Found along the way: Bastion's card orientation typo (`portraitwh`) was blocking the whole content build (FACT-006), a misspelled backdrop filename did the same, and `catalog2.json` pointed at renamed files. Risk: the generated copies and `dist/assets/backgrounds/` are uncommitted (TASK-008).

## 2026-10-26 Home hero, type scale and header
Header logo is the About portrait as a round avatar with the name beside it. Added the Strapline and At a glance sections (off by default, ADR-005), a shared hero spacing token, the Navigation position setting, the split heading/body type scale and the mono text role (ADR-006). Evidence: computed sizes and gaps measured in a browser (REQ-009); tests/content-widths.mjs updated for the new section keys. Left: Top navigation menus open upward (TASK-002).

## 2026-10-26 Backdrops, featured stage and reveal
Per-project backdrops linked by asset id with a generic fallback (ADR-002), a Featured stage layout and a Project backdrop image setting, and a timed reveal as each stage scrolls in (ADR-003). All nine home projects are featured. Evidence: tests/project-backdrop.mjs passes; stage geometry and reveal replay measured in a browser at 1440×900 (REQ-002 to REQ-005). Left: Porter has no backdrop yet (TASK-007); Bastion became portrait, which breaks tests/masonry-placement.mjs (TASK-001).

## 2026-10-26 Simple-transition image return
Home images were requested again after a simple transition and appeared after the fade-in. `MediaLoader` now holds one `Image` per loaded URL. Evidence: tests/media-loading.mjs passes with a new case; all images ready with no requests under simulated latency (REQ-012, FACT-007).

## 2026-10-25 Dock, project status and navigation fixes
Fixed a sliver drawn across the dock during Back (the back-pill splice matched the right edge's text when the pill width ended in 0), with a regression test (REQ-010). Dock outside composer mode now uses the Assistant button's glass. Added a required `projectStatus` (Launched, Building, R&D) to every project (REQ-013). Lab links and the composer's attach button were hidden, not removed.

## 2026-10-24 Lab page and ambient glow
Added `lab.html` with a single colour-split ripple transition (ADR-004, REQ-006). Ambient glow gained an automatic colour mode that samples the card media, a per-project manual override, a strength slider, and a rise from below the viewport (REQ-007). Evidence: ripple measured in a browser through both page changes; glow colours measured per project and mode.
