# MyAgedCare

MyAgedCare is a Phoenix-based application designed to help users find and manage aged care service providers. Users can search for nearby aged care service providers based on location, get detailed information, and schedule visits.

**🔗 [Live Demo: https://my-phoenix-app.fly.dev/providers](https://my-phoenix-app.fly.dev/providers)**

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

This project uses [ASDF](https://asdf-vm.com/) to manage tool versions:
- Erlang: 27.0.0
- Elixir: 1.18.3-otp-27
- Phoenix (~> 1.7)
- PostgreSQL

### Development Environment Setup

#### 1. ASDF Setup (Recommended)

```bash
# Install ASDF (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1

# Add to your shell (bash)
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
source ~/.bashrc

# Add to your shell (zsh)
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc
echo 'fpath=(${ASDF_DIR}/completions $fpath)' >> ~/.zshrc
echo 'autoload -Uz compinit && compinit' >> ~/.zshrc
source ~/.zshrc

# Install plugins
asdf plugin add erlang
asdf plugin add elixir

# In project directory, this will install versions from .tool-versions
cd MyAgedCare
asdf install
```

### 2. Project Setup

```bash
# Clone repository
git clone https://github.com/xinya0liu/MyAgedCare.git

# Navigate to project
cd MyAgedCare && ls -la

# Copy setup script
cp ../setup_db.exs .

# Install dependencies
mix deps.get

# Create database
mix ecto.create

# Run migrations
mix ecto.migrate

# Load initial data
mix run setup_db.exs
```

✅ The setup script will:
- Clear existing data
- Insert 8 aged care provider records
- Display the record count (8) in the database

### 3. Launch Application

```bash
# Start Phoenix server
mix phx.server
```

📱 **Access the application:**
- Local: [http://localhost:4000](http://localhost:4000)

## Contributing

Contributions via issues and pull requests are welcome.

**Note for contributors:**
- The project includes a `.tool-versions` file to ensure consistent development environments
- Run `asdf install` in the project directory to use the correct versions

## License

This project is licensed under the MIT License.

## Learn More

- [Phoenix Framework](https://www.phoenixframework.org/)
- [Phoenix Guides](https://hexdocs.pm/phoenix/overview.html)
- [Phoenix Docs](https://hexdocs.pm/phoenix)
- [Elixir Forum](https://elixirforum.com/c/phoenix-forum)
- [Phoenix Source](https://github.com/phoenixframework/phoenix)
- [ASDF Version Manager](https://asdf-vm.com/)
