defmodule MyPhoenixApp.Providers do
  @moduledoc """
  Provider service context
  Handles business logic related to aged care providers
  """

  import Ecto.Query
  alias MyPhoenixApp.Repo
  alias MyPhoenixApp.Providers.AgedCareProvider

  @doc """
  List providers near a given location
  Calculate point-to-point distance and sort by distance
  
  ## Parameters
  
    - latitude: User location latitude
    - longitude: User location longitude
    - radius: Search radius (kilometers)
  
  ## Return Value
  
  Returns a formatted list of providers, each containing distance information
  """
  def list_nearby_providers(latitude, longitude, radius) when is_number(latitude) and is_number(longitude) do
    # Build query
    query = AgedCareProvider.list_nearby(latitude, longitude, radius)
    
    # Execute query
    providers = Repo.all(query)
    
    # Process results
    providers
    |> Enum.map(fn provider ->
      # Calculate readable distance
      readable_distance = 
        case provider.distance do
          d when d < 1000 -> "#{round(d)} meters"
          d -> "#{Float.round(d / 1000, 1)} kilometers"
        end
      
      # Build API response format
      %{
        id: provider.id,
        name: provider.name,
        address: provider.address,
        description: provider.description,
        phone: provider.phone,
        latitude: provider.latitude,
        longitude: provider.longitude,
        services: provider.services || [],
        care_types: provider.care_types || [],
        image_url: provider.image_url,
        distance_meters: provider.distance,
        distance_text: readable_distance
      }
    end)
  end

  @doc """
  Get details for a single provider
  
  ## Parameters
  
    - id: Provider ID
  
  ## Return Value
  
  Returns details for a single provider, or nil if not found
  """
  def get_provider(id) do
    case Repo.get(AgedCareProvider, id) do
      nil -> nil
      provider -> 
        %{
          id: provider.id,
          name: provider.name,
          address: provider.address,
          description: provider.description,
          phone: provider.phone,
          latitude: provider.latitude,
          longitude: provider.longitude,
          services: provider.services || [],
          care_types: provider.care_types || [],
          image_url: provider.image_url
        }
    end
  end
end 