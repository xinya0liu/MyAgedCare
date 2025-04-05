# Script to update image_url for existing aged care providers
# Run with: mix run priv/repo/seeds/update_existing_providers.exs

alias MyPhoenixApp.Repo
alias MyPhoenixApp.Providers.AgedCareProvider

providers_to_update = [
  %{id: 4, image_url: "/images/provider_4.jpg"},
  %{id: 5, image_url: "/images/provider_5.jpg"},
  %{id: 6, image_url: "/images/provider_6.jpg"}
]

for provider_data <- providers_to_update do
  case Repo.get(AgedCareProvider, provider_data.id) do
    nil ->
      IO.puts("Provider with ID #{provider_data.id} not found")
    
    provider ->
      provider
      |> AgedCareProvider.changeset(%{image_url: provider_data.image_url})
      |> Repo.update!()
      IO.puts("Updated provider: #{provider.name} with image_url: #{provider_data.image_url}")
  end
end

IO.puts("\nCompleted updating aged care providers!") 