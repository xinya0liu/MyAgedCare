# How to run: mix run setup_db.exs
# This script will create necessary database tables and insert seed data

alias MyPhoenixApp.Repo
alias MyPhoenixApp.Providers.AgedCareProvider

IO.puts("Starting database setup...")

# Ensure table structure is migrated
IO.puts("\nRunning database migrations...")
case System.cmd("mix", ["ecto.migrate"], cd: ".") do
  {output, 0} -> IO.puts("Migration successful: #{output}")
  {error, _} -> IO.puts("Note: Migration may already exist or an error occurred: #{error}")
end

# Clear existing data
IO.puts("\nClearing existing data...")
Repo.delete_all(AgedCareProvider)
IO.puts("Cleared aged_care_providers table")

# Insert seed data
IO.puts("\nStarting seed data insertion...")

# Aged care provider data
providers = [
  %{
    name: "Victoria Cross Aged Care",
    description: "Providing quality aged care services in Brisbane",
    address: "45 Miller Street, Brisbane QLD 4000",
    phone: "07 3555 1234",
    latitude: -27.695,
    longitude: 153.222,
    services: ["Residential Care", "Respite Care", "Dementia Care"],
    care_types: ["High Care", "Low Care", "Dementia Care"],
    image_url: "/images/provider_1.jpg"
  },
  %{
    name: "Brisbane Care Center",
    description: "Comprehensive aged care facility in the heart of Brisbane",
    address: "123 Berry Street, Brisbane QLD 4000",
    phone: "07 3555 5678",
    latitude: -27.693,
    longitude: 153.223,
    services: ["Residential Care", "Palliative Care", "Rehabilitation"],
    care_types: ["High Care", "Palliative Care"],
    image_url: "/images/provider_2.jpg"
  },
  %{
    name: "Berry Square Senior Living",
    description: "Modern senior living community with a focus on independence",
    address: "78 Berry Street, Brisbane QLD 4000",
    phone: "07 3555 9012",
    latitude: -27.697,
    longitude: 153.221,
    services: ["Independent Living", "Assisted Living", "Social Activities"],
    care_types: ["Low Care", "Independent Living"],
    image_url: "/images/provider_3.jpg"
  },
  %{
    name: "Sunshine Aged Care",
    description: "A bright and friendly aged care facility offering personalized care.",
    address: "10 Sunshine Boulevard, Brisbane QLD 4000",
    phone: "07 3555 2468",
    latitude: -27.690,
    longitude: 153.225,
    services: ["Residential Care", "Respite Care", "Physiotherapy", "Social Programs"],
    care_types: ["High Care", "Low Care", "Respite Care"],
    image_url: "/images/provider_4.jpg"
  },
  %{
    name: "Golden Years Living",
    description: "Luxury aged care with a focus on comfort and social engagement.",
    address: "25 Golden Road, Brisbane QLD 4000",
    phone: "07 3555 3690",
    latitude: -27.688,
    longitude: 153.220,
    services: ["Residential Care", "Luxury Suites", "Fine Dining", "Weekly Excursions"],
    care_types: ["High Care", "Independent Living", "Couples Accommodation"],
    image_url: "/images/provider_5.jpg"
  },
  %{
    name: "Riverfront Retirement",
    description: "Scenic riverside location with modern facilities and attentive staff.",
    address: "88 River View Drive, Brisbane QLD 4000",
    phone: "07 3555 7890",
    latitude: -27.698,
    longitude: 153.227,
    services: ["Residential Care", "Respite Care", "River Views", "Gardens"],
    care_types: ["Low Care", "Dementia Care", "Palliative Care"],
    image_url: "/images/provider_6.jpg"
  },
  %{
    name: "Parkview Care Center",
    description: "Nestled beside a beautiful park with a focus on outdoor activities.",
    address: "120 Park Lane, Brisbane QLD 4000",
    phone: "07 3555 4567",
    latitude: -27.691,
    longitude: 153.219,
    services: ["Residential Care", "Garden Therapy", "Outdoor Activities", "Pet Therapy"],
    care_types: ["High Care", "Low Care", "Respite Care"],
    image_url: "/images/provider_7.jpg"
  },
  %{
    name: "Serenity Aged Living",
    description: "Peaceful environment designed for comfort and tranquility.",
    address: "55 Tranquil Street, Brisbane QLD 4000",
    phone: "07 3555 8910",
    latitude: -27.694,
    longitude: 153.226,
    services: ["Residential Care", "Meditation Programs", "Spa Services", "Quiet Spaces"],
    care_types: ["High Care", "Dementia Care", "Palliative Care"],
    image_url: "/images/provider_8.jpg"
  }
]

# Insert data
inserted_count = Enum.reduce(providers, 0, fn provider, count ->
  case %AgedCareProvider{} |> AgedCareProvider.changeset(provider) |> Repo.insert() do
    {:ok, _} -> 
      IO.puts("Added provider: #{provider.name}")
      count + 1
    {:error, changeset} -> 
      IO.puts("Failed to add provider: #{provider.name}, Error: #{inspect(changeset.errors)}")
      count
  end
end)

IO.puts("\nSuccessfully inserted #{inserted_count} aged care providers!")

# Confirm data has been inserted
count = Repo.aggregate(AgedCareProvider, :count, :id)
IO.puts("\nThere are currently #{count} aged care provider records in the database")

IO.puts("\nDatabase setup complete!") 