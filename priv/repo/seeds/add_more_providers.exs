# Script to add more aged care providers to the database
# Run with: mix run priv/repo/seeds/add_more_providers.exs

alias MyPhoenixApp.Repo
alias MyPhoenixApp.Providers.AgedCareProvider

providers = [
  %{
    name: "Sunshine Aged Care",
    description: "A bright and friendly aged care facility offering personalized care.",
    address: "10 Sunshine Boulevard, Brisbane QLD 4000",
    phone: "07 3555 2468",
    latitude: -27.690,
    longitude: 153.225,
    services: ["Residential Care", "Respite Care", "Physiotherapy", "Social Programs"],
    care_types: ["High Care", "Low Care", "Respite Care"],
    image_url: "/images/provider_7.jpg"
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
    image_url: "/images/provider_8.jpg"
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
    image_url: "/images/provider_9.jpg"
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
    image_url: "/images/provider_10.jpg"
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
    image_url: "/images/provider_11.jpg"
  }
]

for provider <- providers do
  case Repo.get_by(AgedCareProvider, name: provider.name) do
    nil ->
      %AgedCareProvider{}
      |> AgedCareProvider.changeset(provider)
      |> Repo.insert!()
      IO.puts("Added provider: #{provider.name}")
    
    existing ->
      IO.puts("Provider already exists: #{existing.name}")
  end
end

IO.puts("\nCompleted adding aged care providers!") 