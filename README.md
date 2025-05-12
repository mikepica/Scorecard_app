# Scorecard App

A web application for managing and displaying scorecard data from CSV files.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Place your CSV file in the `data` directory (e.g., `data/DummyData.csv`)

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
   CSV_FILE_PATH=data/your-file.csv npm run dev
   ```

- ### Data Directory Structure
- The `data` directory is used to store CSV files and is gitignored by default. This means:
- - You can keep your data files local to your environment
- - Different repositories can use different data files
- - Sensitive data can be kept out of version control

- To use the application:
- 1. Create a `data` directory if it doesn't exist
- 2. Place your CSV file in the `data` directory
- 3. The file will be automatically ignored by git


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