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
