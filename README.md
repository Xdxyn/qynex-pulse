
# Qynex Pulse

Universal time clock + breadcrumb GPS mileage + live map + approvals + exports.

## Features

- **Time Clock**: Start and stop shifts with job coding.
- **GPS Mileage**: Tracks location breadcrumbs and calculates mileage based on speed thresholds (driving mode).
- **Live Map**: Real-time view of active staff locations.
- **Approvals**: Admin interface to approve/reject shift edits.
- **Staff Scheduler**: AI-assisted or manual scheduling.
- **Exports**: Download CSV reports.

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file with your Supabase credentials:
    ```
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_ANON_KEY=your_key
    ```

3.  **Run Locally**
    ```bash
    npm run dev
    ```

## Project Structure

- `/components`: UI components (TimeClock, ShiftHistory, Maps, etc.)
- `/lib`: Supabase client configuration.
- `/types`: TypeScript interfaces for DB schema.
