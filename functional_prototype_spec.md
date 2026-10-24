# MissionMinded

## Vision Statement

We want to create a centralized app for missionary supporters to stay connected and prepared before and during a missionary's service. The app serves as a resource for:

- Keeping track of a missionary's important dates and when trainings begin
- Staying organized and up to date with mission-specific attire and general needs
- Giving supporters their missionary's mission assignment details and location
- "Following" a missionary throughout their journey, from start to finish

Missionary supporters often struggle to know where to go for resources other than the missionary's Mission Portal. They join Facebook groups or download multiple apps that each serve a different purpose. Our vision is to solve the resource accessibility problem by making many features available in one consistent space.

---

## Problem Statement

Missionary supporters struggle to keep all resources in one place. Resources are spread across different apps and technologies, and nothing is standardized or compiled in one place besides official Church resources. This results in confusion and miscommunication.

---

## Solution Concept

Develop an app built for missionary supporters to have all mission resources in one place. This avoids looking on multiple platforms, such as different apps with singular features or Facebook mission groups for intel. Supporters can access MissionMinded and find features they would otherwise only find in specific apps, now compiled together for ease of access.

### Proposed Features

| Feature                           | Description                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mission-specific packing list** | Helps supporters find needed essentials and attire for a missionary preparing to serve. The Missionary Portal has a general packing list, and emails with mission-specific items are sent later. MissionMinded documents and regularly updates mission-specific needs (relevant to climate or cultural standards) so supporters can find what they need. |
| **Mission assignment location**   | Shown alongside the other features in one app instead of a separate app. Gives supporters visibility into the country or region itself on the map.                                                                                                                                                                                                       |
| **Mission countdowns**            | Available both before the missionary starts their mission and when they start training. The countdown starts the day the supporter enrolls and connects missionary data by "following" them, then switches to an in-field countdown when the missionary starts service, running to the end of their last transfer.                                       |
| **Shopping list (potential)**     | A potential feature connected to the Packing List tab. Would provide discount or promo codes, where to shop online for specific items, and what most missionaries have bought from which brands.                                                                                                                                                         |

---

## User and Context

MissionMinded is centered on missionary supporters for The Church of Jesus Christ of Latter-day Saints who want to stay involved in their missionary's pre-mission progress and track their progress during their mission as well.

Missionary supporters use the app on their mobile devices:

- During the beginning stages of a missionary being called to a mission
- When their missionary starts training, to count down the days until they finish their mission

The missionary receives a mission assignment, and the missionary supporter inputs that mission information into MissionMinded to connect with their missionary.

MissionMinded aims to provide those supporting missionaries with resources and best practices for preparing to send a missionary off and obtain essentials. Supporters want to stay updated on:

- How far along their missionary is before and during the mission
- Where their missionary is in their experience
- How to support their missionary spiritually, not just logistically

---

## Content Hierarchy

### What Matters Most

What matters most on the screen for the missionary supporter:

1. A simple home page with a daily scripture thought and a card for each linked missionary
2. A five-stage journey tracker on each missionary card (Called, Preparing, MTC, Serving, Home) with a plain-language status such as "Preparing to serve" or "Serving in Wasilla", instead of a large countdown number
3. A missionary page with:
   - **Their journey**: a timeline of milestones (for example: mission call opened, receiving his endowment, farewell talk, enters the MTC, serving)
   - **Growing together this week**: study and prayer actions the supporter can check off
   - **To ponder as a family**: a scripture for family reflection
   - **"Guess where this missionary is going on their mission?"** (pre-mission only)
   - **Mission details** (expandable): mission map, companion, area, mission leaders, and mission office with call and email
4. A packing list dynamically pulled from mission details and mission-specific climate attire

### Spiritual Focus

- A daily scripture thought on the home page
- A weekly "Growing together" section for each missionary (for example, read Preach My Gospel or Alma 32 together, or pray for the missionary as a family)
- A "To ponder as a family" scripture on each missionary page
- Optional reminders in Profile settings: daily scripture thought, milestone reminders, prayer reminders

### Loading Experience

- The loading page shows a quick scripture or quote while loading between pages.

### Required Navigation Bar Tabs

| Tab              | Contents                                                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home**         | Greeting; thought for today; "Your missionaries" cards with status and journey stage tracker; link a missionary. Tapping a card opens that missionary's page (journey, growing together, ponder as a family, guess game, expandable mission details). |
| **Calendar**     | Missionary selector; **next milestone** (replaces the countdown); month calendar; missionary to-dos and appointments; add appointment                                                                                                                 |
| **Packing List** | Missionary selector; essentials for all missions; mission-specific items for the mission's climate; shopping marked "coming later"                                                                                                                    |
| **Profile**      | Supporter name and ward/stake; "Missionaries I support" with the supporter's relationship to each; link a missionary; settings toggles                                                                                                                |

### Link a Missionary Form

Fields: missionary name, your relationship (for example Mom, Sister, Friend), mission name, MTC report date, and mission length. Anything unknown can be added later. (MTC location was removed from the form.)

### Avoiding Redundancy

- Mission map, companion, area, leaders, and office details appear **only inside Mission details** on the missionary page, not on Home or Profile.
- Home shows status and the journey tracker only; detail lives one tap deeper.
- Profile is now about the supporter: relationships, linking, and settings.
- There is no numeric countdown. Calendar shows the next milestone instead.

### Changes From the Original Vision

- The countdown is replaced by journey stages and a next-milestone line, to be more personal and less data-focused.
- Mission assignment details moved from the Profile tab to the missionary page (Mission details). This matters for usability testing, which should check whether supporters can easily find them there.
- The during-mission progress bar and "days left" were replaced by the journey timeline.

### What Can Wait

- Shopping (discount codes, promo codes, and brand recommendations)
- Paid ads from missionary clothing and essential outfitters

---

## Constraints

- Missions have limited details in their mission info. The app shows "Some details aren't released yet" and fills them in as the missionary shares them.
- There are limitations on disclosing Church data on mission assignments.
- **Not in scope:**
  - Adding photos
  - A missionary journal
  - Instant messaging
  - A notes section on the profile (removed after feedback)
- **Mission emails / weekly email list:** Not a designated feature.

---

## Fidelity

- **Fidelity level:** Functional, clickable prototype with prototyping ability and flow
- **Frame:** iPhone-shaped frame, usable on screen
- **Functionality:** Four tabs with working interactions (checklists, expandable details, guess game, add appointment, link a missionary, settings toggles)
- **Color:** Navy, light blue, and white, taken from the paper prototype
- **Flow (wireframe v2):** Loading screen with scripture, then Home, then a missionary page. Login and account creation were in the paper prototype but are not shown in wireframe v2.
- **Sample data:** Elder Jacob Thompson-Whitaker (Peru Lima North Mission, pre-mission, brother) and Sister Ana Taylor (Alaska Anchorage Mission, serving, cousin)

---

## Digital Wireframe Feedback and How It Was Applied

| Feedback                                                                                                        | Change                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home page is too busy, and info is repeated between home and profile                                            | Home reduced to a greeting, a scripture, and missionary cards; mission details moved into one expandable section on the missionary page; Profile focuses on the supporter           |
| Make it less data-focused and more personal to the spirituality and testimony growth of a missionary and family | Added a daily scripture thought, a journey timeline, "Growing together this week" actions, and "To ponder as a family" scriptures; added prayer and scripture reminders in settings |
| Countdowns are over-emphasized                                                                                  | Countdown removed; replaced by journey stages on Home and a next-milestone line on Calendar                                                                                         |
| Profile notes section may not be useful                                                                         | Notes section removed; Profile now shows relationships and settings                                                                                                                 |

---

## Proposed Research Methods

| Method                | Plan                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interviews**        | Interview current missionary supporters who have missionaries in service, and future supporters who have a household member or friend who has received their mission call. |
| **Diary studies**     | Because the app tracks behavior through missionary progress, have supporters use the app for a month to observe the pre-mission to starting-a-mission transition.          |
| **Concept testing**   | Draw simple sketches of each page concept and ask supporters what they like and dislike about each feature. Helps identify what to skip, what is missing, and the MVP.     |
| **Usability testing** | See where functionality lies and how easily people access it. For example, test whether supporters can easily find mission assignment details in the Profile tab.          |

---

## Team Members and Roles

| Name            | Role                             |
| --------------- | -------------------------------- |
| Annabelle Baker | Researcher, Designer & Developer |
| Sophia Bushman  | Researcher, Designer & Developer |

---

## Proposed Technology Stack

| Area                            | Tools                                          |
| ------------------------------- | ---------------------------------------------- |
| **Wireframes and prototypes**   | Figma and Claude AI to build out prototypes    |
| **Frontend**                    | React Native (for iOS and Android), HTML + CSS |
| **Backend**                     | Firebase (or potentially MongoDB)              |
| **Hosting and version control** | GitHub                                         |

### Database Note

- **Recommended:** Firebase (Firestore plus Firebase Auth), for built-in login, easy syncing across family members' phones, and per-family access rules.
- MongoDB is a workable alternative but would require building a separate backend and authentication.
- Mission details should be optional, user-entered fields because Church data on assignments is limited.
