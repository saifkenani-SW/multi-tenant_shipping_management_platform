# Multi-Tenant Logistics Platform - Bruno API Collection

Welcome to the Bruno API collection! This directory contains all the HTTP requests needed to test the application locally.

## Getting Started

1. **Install Bruno**: Download it from [usebruno.com](https://www.usebruno.com/).
2. **Open Collection**: Open Bruno, click "Open Collection", and select the `backend/bruno` folder.
3. **Select Environment**: In the top right corner of Bruno, select the `local` environment from the dropdown.

## Managing Variables

This collection uses environments to manage dynamic variables like `{{url}}` and `{{token}}`.

- **Base URL**: The `local` environment has the `url` predefined as `http://localhost:3000/api/v1`.
- **Authentication**: Most endpoints require a JWT token. After calling the `Login` endpoint, copy the `accessToken` and paste it into the `token` variable in your active environment (or save it to your local `.env`).

*Note: You can override variables safely in a `.env` file within the `backend/bruno` directory. `.env` files are ignored by git to keep your secrets secure.*
