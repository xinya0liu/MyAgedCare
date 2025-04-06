defmodule MyPhoenixAppWeb.GoogleMapsProxyController do
  use MyPhoenixAppWeb, :controller
  require Logger

  # Supported Google Maps API endpoints
  @supported_endpoints [
    "maps/api/js",             # Maps JavaScript API
    "maps/api/geocode/json",   # Geocoding API
    "maps/api/place",          # Places API
    "maps/api/directions/json" # Directions API
  ]

  # Proxy Google Maps API requests
  def proxy(conn, params) do
    endpoint = params["endpoint"]
    
    # Add security check, only allow calling specific APIs
    if allowed_endpoint?(endpoint) do
      # Get API key
      api_key = Application.get_env(:my_phoenix_app, :google_maps_api_key)
      
      # Check if API key is available
      if api_key && api_key != "" && api_key != "YOUR_GOOGLE_MAPS_API_KEY" do
        # Build Google API URL
        url = build_google_url(endpoint, params, api_key)
        Logger.debug("Proxying to Google Maps API: #{url}")
        
        # Send request to Google
        case HTTPoison.get(url, [], [follow_redirect: true, timeout: 10000, recv_timeout: 10000]) do
          {:ok, response} ->
            # Set appropriate content type
            content_type = get_content_type(endpoint, response.headers)
            
            # Return Google's response
            conn
            |> put_resp_content_type(content_type)
            |> send_resp(response.status_code, response.body)
            
          {:error, error} ->
            Logger.error("Error proxying Google Maps API request: #{inspect(error)}")
            
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to proxy request to Google Maps API", details: inspect(error)})
        end
      else
        Logger.error("Google Maps API key is not configured correctly")
        
        # Provide clear error message for development environment
        if Mix.env() == :dev do
          conn
          |> put_status(:bad_request)
          |> json(%{
            error: "Google Maps API key is not configured",
            message: "Please set a valid GOOGLE_MAPS_API_KEY in your environment variables or .env file"
          })
        else
          conn
          |> put_status(:internal_server_error)
          |> json(%{error: "Server configuration error"})
        end
      end
    else
      Logger.warning("Attempted to access unauthorized Google Maps API endpoint: #{endpoint}", %{endpoint: endpoint})
      
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Access to this Google Maps API endpoint is not allowed"})
    end
  end

  # Check if access to the requested endpoint is allowed
  defp allowed_endpoint?(endpoint) when is_list(endpoint) do
    # Convert list to string path
    endpoint_path = Enum.join(endpoint, "/")
    Enum.any?(@supported_endpoints, &String.starts_with?(endpoint_path, &1))
  end
  
  defp allowed_endpoint?(endpoint) when is_binary(endpoint) do
    Enum.any?(@supported_endpoints, &String.starts_with?(endpoint, &1))
  end
  
  defp allowed_endpoint?(_), do: false

  # Build Google Maps API URL
  defp build_google_url(endpoint, params, api_key) when is_list(endpoint) do
    # Convert list to string path
    endpoint_path = Enum.join(endpoint, "/")
    build_google_url(endpoint_path, params, api_key)
  end
  
  defp build_google_url(endpoint, params, api_key) when is_binary(endpoint) do
    base_url = "https://maps.googleapis.com/#{endpoint}"
    
    # Get query parameters from original request
    query_params = params
                   |> Map.drop(["endpoint"]) # Remove our routing parameter
                   |> Map.put("key", api_key) # Add API key
                   |> URI.encode_query()
    
    "#{base_url}?#{query_params}"
  end

  # Determine appropriate content type
  defp get_content_type(endpoint, headers) do
    # Extract content type from Google response headers
    case List.keyfind(headers, "Content-Type", 0) do
      {_, content_type} -> content_type
      nil ->
        cond do
          String.ends_with?(endpoint, ".js") -> "application/javascript"
          String.ends_with?(endpoint, ".json") -> "application/json"
          String.contains?(endpoint, "geocode") -> "application/json"
          String.contains?(endpoint, "place") -> "application/json"
          String.contains?(endpoint, "directions") -> "application/json"
          true -> "application/octet-stream"
        end
    end
  end
end 