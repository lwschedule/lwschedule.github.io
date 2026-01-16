# LW Schedule

## Overview
A Progressive Web App (PWA) for viewing school schedules. Built as a static website with HTML, CSS, and JavaScript.

## Project Structure
- `/` - Main HTML pages and assets
- `/data/` - JSON data files (holidays, schedules, terms)
- `/icons/` - PWA icons
- `/images/` - Image assets
- `/settings/`, `/today/`, `/week/`, `/month/`, `/holidays/`, `/quarters/`, `/schedules/`, `/info/`, `/setup/` - Feature pages

## Tech Stack
- Pure HTML/CSS/JavaScript (no build step)
- PWA with service worker (`sw.js`)
- Static file server (`serve`)

## Running the Project
The project uses `npx serve -l 5000` to serve static files on port 5000.

## Deployment
Static deployment - all files are served directly without a build step.
