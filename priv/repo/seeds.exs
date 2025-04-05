# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     MyPhoenixApp.Repo.insert!(%MyPhoenixApp.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

alias MyPhoenixApp.Repo
alias MyPhoenixApp.Providers.AgedCareProvider

# Clear existing data
Repo.delete_all(AgedCareProvider)

# Sample data
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
    image_url: nil
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
    image_url: nil
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
    image_url: nil
  }
]

# Insert the data
Enum.each(providers, fn provider ->
  %AgedCareProvider{}
  |> AgedCareProvider.changeset(provider)
  |> Repo.insert!()
end)

IO.puts "Seed data inserted successfully!"
