# MyAgedCare

MyAgedCare is a Phoenix-based application designed to help users find and manage aged care service providers. Users can search for nearby aged care service providers based on location, get detailed information, and schedule visits.

## Features

- Map-based service provider search
- Distance filtering functionality
- Detailed provider information including service types, facilities, and contact information
- Responsive design that adapts to various device sizes
- User notification system

## Technology Stack

- Elixir/Phoenix Framework
- PostgreSQL Database
- TailwindCSS for styling
- Google Maps API integration
- LiveView for real-time interactions

## Installation and Setup

### Prerequisites

- Elixir (~> 1.14)
- Phoenix (~> 1.7)
- PostgreSQL
- Node.js and npm

### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/xinya0liu/MyAgedCare.git
   cd MyAgedCare
   ```

2. Install dependencies:

   ```bash
   mix deps.get
   cd assets && npm install && cd ..
   ```

3. Configure the database:

   ```bash
   mix ecto.setup
   ```

4. Set up environment variables:
   Create a `.env` file and set necessary environment variables, such as the Google Maps API key:

   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

5. Start the Phoenix server:

   ```bash
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key mix phx.server
   ```

6. Visit [`localhost:4000`](http://localhost:4000) to view the application.

## Google Maps API Key Security Configuration

To ensure the security of Google Maps API key, this application implements the following best practices:

Key Setup
	1.	Environment Variable Configuration: Avoid hardcoding the API key in your code; instead, use environment variables:
    export GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    
   2.	API Key Restrictions: Configure restrictions for your API key in the Google Cloud Console: ￼
	•	Application Restrictions: Limit usage to specific platforms (e.g., HTTP referrers for websites).
	•	API Restrictions: Restrict the key to specific APIs (e.g., only enable Maps JavaScript API). ￼
	•	Quota Limits: Set usage quotas to prevent unexpected overages. 

The application incorporates the following security measures:
	1.	Backend Proxying: All Google Maps API requests are routed through a backend proxy to prevent exposing the API key to clients.
	2.	Referrer Validation: Ensures requests originate from authorized domains.
	3.	Rate Limiting: Controls the frequency of API calls to prevent abuse.
	4.	URL Signing: Supports signature validation for API requests.
	5.	Request Filtering: Allows only specific types of API requests.
	6.	Error Handling: Conceals sensitive error information in production environments.

Production Environment Setup

When deploying to production:
	1.	Update Domain List: Modify the valid_referer? function to include your production domain(s).
	2.	Enforce HTTPS: Ensure all API communications occur over secure HTTPS connections.
	3.	Monitor Usage: Regularly review API usage in the Google Cloud Console to detect anomalies.
	4.	Rotate API Keys: Periodically regenerate API keys, especially if compromise is suspected.

 ## Contributing

Contributions via issues and pull requests are welcome.

## License

This project is licensed under the MIT License.

## Learn more

- Official website: https://www.phoenixframework.org/
- Guides: https://hexdocs.pm/phoenix/overview.html
- Docs: https://hexdocs.pm/phoenix
- Forum: https://elixirforum.com/c/phoenix-forum
- Source: https://github.com/phoenixframework/phoenix
