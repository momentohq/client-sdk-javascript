<img src="{{LOGO_URL}}" alt="logo" width="400"/>

[![project status]({{PROJECT_STATUS_BADGE_URL}})]({{PROJECT_STATUS_LINK}})
[![project stability]({{PROJECT_STABILITY_BADGE_URL}})]({{PROJECT_STABILITY_LINK}})


# {{PROJECT_TITLE}}

## About
{{PROJECT_DESCRIPTION}}

### **Prerequisites:**
- Momento Cache: {{CACHE_NAME}}. If cache does not exists, can create one using the [momento console](https://console.gomomento.com/).
- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- AWS Account AccessId, AWS Secret Key (and AWS Session Token if you are using temporary credentials)

## Getting Started
First, edit the `.env.development` file (create one if not exists) with your token vending machine url and your aws credentials:

```bash
VITE_AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
VITE_AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
VITE_AWS_SESSION_TOKEN=<AWS_SESSION_TOKEN> # Optional, if you are using temporary credentials
VITE_MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
```

Then, install all dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to explore the demo app.

