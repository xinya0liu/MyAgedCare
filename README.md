# MyAgedCare

MyAgedCare is a Phoenix-based application designed to help users find and manage aged care service providers. Users can search for nearby aged care service providers based on location, get detailed information, and schedule visits.

🔗 Live Demo: https://my-phoenix-app.fly.dev/providers

## Features

- Map-based service provider search
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

1. **Clone the repository**

   ```bash
   git clone https://github.com/xinya0liu/MyAgedCare.git
   ```

2. **Navigate to project directory**

   ```bash
   cd MyAgedCare
   ```

3. **Copy setup database script**

   ```bash
   cp ../setup_db.exs .
   ```

4. **Install dependencies**

   ```bash
   mix deps.get
   ```

5. **Create database**

   ```bash
   mix ecto.create
   ```

6. **Run database migrations**

   ```bash
   mix ecto.migrate
   ```

7. **Load initial data**

   ```bash
   mix run setup_db.exs
   ```

   ✅ The script will:
   - Clear existing data
   - Insert 8 aged care provider records as seeders
   - Display the number of records (8) in the database

8. **Start Phoenix server**

   ```bash
   mix phx.server
   ```

9. **Access the application**

   Open your browser and visit [http://localhost:4000](http://localhost:4000)

## Contributing

Contributions via issues and pull requests are welcome.

## License

This project is licensed under the MIT License.

## Learn More

- [Official website](https://www.phoenixframework.org/)
- [Guides](https://hexdocs.pm/phoenix/overview.html)
- [Docs](https://hexdocs.pm/phoenix)
- [Forum](https://elixirforum.com/c/phoenix-forum)
- [Source](https://github.com/phoenixframework/phoenix)
