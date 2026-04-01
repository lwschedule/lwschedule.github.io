# LW Schedule

[Features](#-features) · [Upcoming Features](#-upcoming-features-planned) · [Tech Stack](#-tech-stack) · [License](#-license) · [Credits](#-credits)

A fast, clean, dark-themed schedule viewer built for LW students. Check today's schedule, see the whole week at a glance, get automatic holiday countdowns, set lunches, set pack-up reminders, and more — all in one place.

**Live Site:** [https://lwschedule.github.io/](https://lwschedule.github.io/)
**Current Version:** `v2.13`
**Release Date:** `3/31/26`

---

## ✨ Features

---

### 🕒 Smart Timekeeping

* **Digital Clock**
* **Rolling Time Remaining**
* **Next Period Preview**
* **Auto-highlighting current period**
* **Countdown to next school day** (displays days:hours:minutes:seconds when more than 1 day away)

### 📅 Schedules

* **Today's Schedule** — updated based on day of week & holidays, with duration column
* **Week's Schedule** — shows a full week layout with clickable days
  * Automatically shows next week if current week includes weekend or holiday
  * Individual day pages update accordingly
* **Monthly Calendar** — visual calendar view (September 2025 - June 2026; monthly view limited to March–June 2026)
  * Days off shown in red
  * Half days (Thanksgiving week) shown in orange
  * Each day displays schedule summary (e.g., "1,2,3,L,4,5,6")
  * Current day highlighted
* **All Schedules** — access to Normal and special schedules
* **Upcoming Holidays** — full list with live countdown
  * Countdown continues even if current day is a holiday
* **Quarters/Semesters**
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

* 8 color themes (Purple, Red, Orange, Yellow, Green, Blue, Indigo, Pink)
* Static or animated gradient mode
* Fully persistent using localStorage

### 📆 Special Schedules

* Automatic detection and switching between schedule types

### 🎯 Clubs

* Browse and select from 90+ clubs
* See your clubs in Today, Week, and Month views
* Club meeting schedules: weekly, biweekly, monthly, last-of-month patterns
* Toggle clubs on/off in settings
* Search and filter clubs
* Select/deselect all functionality

---

## 🚧 Upcoming Features (Planned)

### 🏫 Custom Classes

* Custom period names
* Class titles
* Teacher names
* Room numbers
* Integrate into Today's Schedule & notifications
* Will be able to skip in setup (with toggle)

### 🚶 Travel Time Estimates

* Auto-calculate travel time between rooms
* Adjust notifications based on walking distance
* Will be able to skip in setup (with toggle)

### ⚽ Sports Support

* Add recurring sports
* Weekly repeat days
* First-time setup reminder
* Search bar to select correct sport
* Will be able to skip in setup (with toggle)

### 📱 Phone Caddy Alerts

* Enter your caddy number per class
* Two-minute warnings before class starts
* Will be able to skip in setup

### Known Bugs

---

## 📝 Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=mit&logoColor=white)

---

## 📜 License

This project is released under the **MIT License**

---

## 💡 Credits

**Created by:** Sanchit P.  
**Inspired by:** [LW Schedule Manager](https://schedule-manager.lwhsftc.org/) by Rudra Pandit
