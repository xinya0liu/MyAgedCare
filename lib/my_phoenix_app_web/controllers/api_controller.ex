defmodule MyPhoenixAppWeb.ApiController do
  use MyPhoenixAppWeb, :controller

  alias MyPhoenixApp.Providers

  @doc """
  Return providers nearest to the specified location
  Required parameters:
  - lat: latitude
  - lng: longitude
  - radius: search radius (kilometers), default is 50km
  """
  def nearby_providers(conn, params) do
    # Parse parameters
    with {:ok, lat} <- parse_float(params["lat"]),
         {:ok, lng} <- parse_float(params["lng"]),
         {:ok, radius} <- parse_radius(params["radius"]) do
      
      # Print information for debugging
      IO.puts("Querying providers near location: Latitude: #{lat}, Longitude: #{lng}, Radius: #{radius} kilometers")
      
      # Get nearby providers
      providers = Providers.list_nearby_providers(lat, lng, radius)
      
      # Return JSON response
      conn
      |> put_resp_content_type("application/json")
      |> json(%{
        success: true,
        center: %{latitude: lat, longitude: lng},
        radius: radius,
        providers: providers,
        count: length(providers)
      })
    else
      {:error, field, message} ->
        # Process invalid parameter errors
        conn
        |> put_status(400)
        |> json(%{
          success: false,
          error: "Invalid #{field}: #{message}"
        })
    end
  end

  @doc """
  Get information for a single provider by ID
  """
  def get_provider(conn, %{"id" => id}) do
    case parse_id(id) do
      {:ok, provider_id} ->
        case Providers.get_provider(provider_id) do
          nil ->
            conn
            |> put_status(404)
            |> json(%{success: false, error: "Provider does not exist"})
          
          provider ->
            conn
            |> put_resp_content_type("application/json")
            |> json(%{success: true, provider: provider})
        end
      
      {:error, message} ->
        conn
        |> put_status(400)
        |> json(%{success: false, error: message})
    end
  end

  # Helper function: Parse ID
  defp parse_id(id) when is_integer(id), do: {:ok, id}
  defp parse_id(id) when is_binary(id) do
    case Integer.parse(id) do
      {num, ""} -> {:ok, num}
      _ -> {:error, "ID must be a valid integer"}
    end
  end
  defp parse_id(_), do: {:error, "Invalid ID format"}

  # Helper function: Parse float
  defp parse_float(nil), do: {:error, "lat/lng", "Parameter cannot be empty"}
  defp parse_float(value) when is_number(value), do: {:ok, value}
  defp parse_float(value) when is_binary(value) do
    case Float.parse(value) do
      {num, _} -> {:ok, num}
      :error -> {:error, "lat/lng", "Must be a valid number"}
    end
  end
  defp parse_float(_), do: {:error, "lat/lng", "Invalid format"}

  # Helper function: Parse and validate search radius
  defp parse_radius(nil), do: {:ok, 50.0}  # Default 50 kilometers
  defp parse_radius(value) when is_number(value) do
    cond do
      value <= 0 -> {:error, "radius", "Must be greater than 0"}
      value > 500 -> {:ok, 500.0}  # Limit maximum radius to 500 kilometers
      true -> {:ok, value}
    end
  end
  defp parse_radius(value) when is_binary(value) do
    case Float.parse(value) do
      {num, _} ->
        cond do
          num <= 0 -> {:error, "radius", "Must be greater than 0"}
          num > 500 -> {:ok, 500.0}  # Limit maximum radius
          true -> {:ok, num}
        end
      :error -> {:error, "radius", "Must be a valid number"}
    end
  end
  defp parse_radius(_), do: {:error, "radius", "Invalid format"}
end