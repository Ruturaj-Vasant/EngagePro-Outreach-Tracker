# EngagePro Outreach Tracker

## Overview
The EngagePro Outreach Tracker is a tool designed to help automate the outreach process with professors for potential TA/RA positions. This project leverages Google Apps Script to send personalized emails to professors and track their interactions. The tool uses a Google Sheet to manage outreach data, and it sends HTML emails with embedded tracking pixels to track profile views.

## Files in the Project:
1. **config.js**: Contains configuration details such as URLs, email sender info, and other settings.
2. **profile.html**: The HTML template used for rendering a profile page that will be sent to the professor via email.
3. **code.js**: The Google Apps Script code that handles the sending of emails, profile tracking, and other logic related to the outreach process.

## Setup Instructions

### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone git@github.com:Ruturaj-Vasant/EngagePro-Outreach-Tracker.git
```

### 2. Update Configurations
In **config.js**, you will find various settings that need to be personalized:

- **senderName**: Your name.
- **senderEmail**: Your email address.
- **senderPhone**: Your phone number.
- **cvUrl, resumeUrl, transcriptUrl**: URLs to your CV, resume, and transcript (these should be hosted somewhere accessible, e.g., GitHub Pages, Dropbox, etc.).
- **scriptUrl**: URL to the Google Apps Script execution endpoint.
- **profilePicId**: Google Drive ID of your profile picture for email signatures.

### 3. Update Google Apps Script
When using this project on Google Apps Script, make sure to change `.js` files to `.gs`. Google Apps Script uses `.gs` extensions for script files, so it's necessary to rename files for compatibility:

- Rename `config.js` to `config.gs`
- Rename `code.js` to `code.gs`

### 4. Deploy on Google Apps Script
1. Open **Google Apps Script** and create a new project.
2. Create new files and copy the contents from the local `.gs` files (**config** and **code**).
3. Link your Google Sheets and ensure the spreadsheet is set up to store email data, including the professor’s name, email, status, and clicks.
4. Deploy the script as a Web App and set it to allow anyone to execute it (if needed).

### 5. Sending Emails
To send outreach emails, simply run the `initiateEmailSending()` function. It will automatically send the emails based on the data in your Google Sheet and update the status accordingly.

### 6. Tracking Profile Views
The email contains a tracking pixel that will trigger updates in the Google Sheet when the professor opens the email. These updates will be logged under the **'Profile Views'** column.

### 7. Feedback
You can save feedback from professors in the Google Sheet. The feedback will be appended to the **'Feedback'** column.

## Important Notes
- Make sure to set the permissions in **Google Apps Script** to allow access to **Gmail** and **Google Sheets**.
- Keep your Google Sheets organized with the correct column names (**Email, Name, Status, LatestStatus, Profile Views, etc.**) to ensure proper functionality.
- Be mindful of the daily email quota and ensure your Google account has sufficient quota to send emails.

