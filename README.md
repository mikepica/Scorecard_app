# Scorecard App

A web application for managing and displaying scorecard data from CSV files.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The application uses a CSV file as its data source. By default, it looks for a file named `DummyData.csv` in the root directory. You can change this by setting the `CSV_FILE_PATH` environment variable.

### Setting the CSV File Path

You can set the CSV file path in one of two ways:

1. Create a `.env` file in the root directory with:
   ```
   CSV_FILE_PATH=path/to/your/file.csv
   ```

2. Set the environment variable directly when running the application:
   ```bash
   CSV_FILE_PATH=path/to/your/file.csv npm run dev
   ```

## Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## CSV File Format

The CSV file should follow this structure:
- First row should contain headers
- Required columns:
  - Strategic Pillar
  - Category
  - Strategic Goal
  - Strategic Program
  - Q1-Q4 Objective
  - Q1-Q4 Status (values: green, amber, red, blue)
  - Q1-Q4 Comments
  - ORD LT Sponsor(s)
  - Sponsor(s)/Lead(s)
  - Reporting owner(s)

## Features

- View scorecard data in an organized dashboard
- Upload new scorecard data via JSON
- Track strategic goals and their progress
- Monitor quarterly objectives and status 