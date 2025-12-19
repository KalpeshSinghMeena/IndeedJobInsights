# Indeed Job Insights

Indeed Job Insights is a powerful Chrome extension designed to enhance the Indeed job search experience. It provides real-time metadata on job cards, helping job seekers make more informed decisions by exposing data typically hidden or obscured.

## ✨ Features

- **Real-Time Data Extraction**: Intercepts Indeed's network traffic to capture 100% of job metadata, including data for infinite-scroll results.
- **Job Age Badges**: Displays the precise time a job was posted (e.g., "Today", "2 days ago", "15 days ago").
- **Applicant Counter**: Shows the number of application clicks/starts associated with each posting.
- **Employer Blocking**: Tired of seeing the same agency? Click "Block" to hide all future postings from that employer instantly.
- **Traffic Light Indicators**: 
    - 🟢 **Green**: Fresh postings with low competition.
    - 🟡 **Amber**: Standard postings.
    - 🔴 **Red**: Postings over a week old or with high applicant counts.
- **Infinite Scroll Support**: Optimized for Indeed's modern layout and dynamic loading.

## 🚀 Getting Started

### Installation

1.  Clone this repository or download the source code.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle in the top right).
4.  Click **Load unpacked** and select the extension directory.
5.  Head over to [Indeed](https://www.indeed.com) and start your search!

## 🛠️ Technical Overview

This extension uses a two-stage architecture to bypass Content Security Policy (CSP) and layout limitations:

1.  **Network Interception (`extract.js`)**: Runs in the `MAIN` world to monkey-patch `window.fetch`. It captures raw JSON job data directly from Indeed's API responses as the user scrolls.
2.  **UI Engine (`content.js`)**: Runs in the `ISOLATED` world. It matches the captured metadata to the job cards on screen and injects custom UI elements.
3.  **Persistence**: Uses `chrome.storage.local` to securely store your blocked employer list.

## 🤝 Contributing

This is an open-source project! Contributions, bug reports, and feature requests are welcome. Feel free to fork the repository and submit a pull request.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [Kalpesh Meena](https://github.com/kalpeshsinghmeena)
