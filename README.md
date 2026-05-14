# Schools CRM v2.5

A lightweight Customer Relationship Management (CRM) system designed specifically for managing school pipelines, tracking visits, and communication stages. 

## Features

- **Dashboard:** Overview of key performance indicators (KPIs) like total schools, agreed schools, and average relationship score, along with pipeline stage distribution.
- **School Management:** Add new schools with details like type, city, average tuition, address, tags, and relationship score. Smart filtering and searching capabilities.
- **Visits Tracking:** Schedule and track visits to schools. Filter by school, month, and visit status.
- **Communication Pipeline:** Track the communication timeline for each school, move schools through different stages, and add specific notes and attachments for each stage change.
- **Reports:** Generate insights on overall metrics and the average time taken to reach different pipeline stages.
- **Multi-language Support:** Interface available in Arabic (default), English, and French.
- **Data Management:** Local data storage with options to backup (export to JSON) and restore (import from JSON) data, as well as a factory reset option.

## Tech Stack

- HTML5
- CSS3 (Custom styling with a responsive UI)
- Vanilla JavaScript (`app.js`)

## Getting Started

1. Clone this repository or download the source code.
2. Open `index.html` in your modern web browser.
3. No server or build process is required for the basic frontend functionality. Data is persisted locally in your browser's local storage.

## Usage

- **Login:** Use the default credentials (if set up) or reset the session to start fresh.
- **Navigation:** Use the top navigation tabs to switch between Dashboard, Schools, Visits, Communication, Reports, and Settings.
- **Adding Data:** Click the `+` buttons in the respective sections to add new schools or visits.
- **Pipeline Progression:** In the Communication tab, search for a school and use the "Next" or "Skip to Agreed" buttons to move them along the pipeline.

## License

This project is open-source.
