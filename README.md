# LW Schedule

[Features](#-features) · [Upcoming Features](#-upcoming-features-planned) · [Tech Stack](#-tech-stack) · [License](#-license) · [Credits](#-credits)

A fast, clean, dark-themed schedule viewer built for LW students. Check today’s schedule, see the whole week at a glance, get automatic holiday countdowns, set lunches, set pack-up reminders, and more — all in one place.

**Live Site:** [https://lwschedule.github.io/](https://lwschedule.github.io/)
**Current Version:** `v1.7`

---

## ✨ Features

### 🕒 Smart Timekeeping

* **Digital Clock**
* **Rolling Time Remaining**
* **Next Period Preview**
* **Auto-highlighting current period**

### 📅 Schedules

* **Today's Schedule** — updated based on day of week & holidays
* **Week’s Schedule** — shows a full week layout
* **Upcoming Holidays** — full list + live countdown
* **Quarters/Semesters** *(new in v1.7)*

  * Shows start/end dates
  * Highlights current active term
  * Shows time remaining (days → hours → minutes → seconds)
  * Marks completed terms automatically

### 🍽 Lunch Preferences

* Set A/B lunch for Monday, Tuesday, Thursday, Friday
* Wednesday automatically assigned to all-school lunch
* First-time setup screen included

### 🎒 Pack-Up Reminder

* Numeric input field
* Optional presets (`Off`, `1`, `3`, `5`, `7`, `10`)
* Save & Continue button
* Reminder notifies X minutes before a period ends

### 🎨 Themes

* 8 color themes
* Static or animated gradient mode
* Fully persistent using localStorage

---

## 🚧 Upcoming Features (Planned)

### 🏫 Custom Classes

* Custom period names
* Class titles
* Teacher names
* Room numbers
* Integrate into Today’s Schedule & notifications
* Will be able to skip in setup

### 🚶 Travel Time Estimates

* Auto-calculate travel time between rooms
* Adjust notifications based on walking distance
* Will be able to skip in setup

### ⭐ Clubs Support

* Add recurring clubs
* Weekly repeat days
* First-time setup reminder
* Will be able to skip in setup

### 📱 Phone Caddy Alerts

* Enter your caddy number per class
* Two-minute warnings before class starts
* Will be able to skip in setup

UI on smaller screens all buttons should be in a 1x4 grid rather than 2x2
Add all schedules button, which shows more info about normal schedule, and special schedule (each hidden behind buttons)
Add durations for classes in today's schedule
Add months schedule, that looks like calendar, half days orange, and days off red, each day should show the numbers/summary of schedule (e.g. 1,2,3,L,4,5,6)
Winter break starts dec 20, and ends jan 4
Edit holidays to include weekends, if it is a long weekend or break attached to weekend
Monthly calnedar will be sep 2025, to jun2026
add skip option to pick up reminders setup, then value will be set to off
Fix issue on friday where 3 period should starts 1142 and ends 1230
remove all comments and commented code
if time until
next school day is graeter than 1 day then it should show x:x:x:x

---

## 📝 Tech Stack

* **HTML / CSS / JavaScript (Vanilla)**
* Animations via CSS keyframes
* Persistent settings via `localStorage`
* Hosted with **GitHub Pages**

---

## 📜 License

This project is released under the **MIT License**.

---

## 💡 Credits

**Created by:** Sanchit P.
**Inspired by:** LW Schedule Manager by Rudra Pandit
