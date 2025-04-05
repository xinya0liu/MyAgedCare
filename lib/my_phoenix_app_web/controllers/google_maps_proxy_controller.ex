defmodule MyPhoenixAppWeb.GoogleMapsProxyController do
  use MyPhoenixAppWeb, :controller
  require Logger

  # 支持的Google Maps API端点
  @supported_endpoints [
    "maps/api/js",             # Maps JavaScript API
    "maps/api/geocode/json",   # Geocoding API
    "maps/api/place",          # Places API
    "maps/api/directions/json" # Directions API
  ]

  # 代理Google Maps API请求
  def proxy(conn, params) do
    endpoint = params["endpoint"]
    
    # 添加安全检查，仅允许调用特定API
    if allowed_endpoint?(endpoint) do
      # 获取API密钥
      api_key = Application.get_env(:my_phoenix_app, :google_maps_api_key)
      
      # 检查API密钥是否可用
      if api_key && api_key != "" && api_key != "YOUR_GOOGLE_MAPS_API_KEY" do
        # 构建Google API URL
        url = build_google_url(endpoint, params, api_key)
        Logger.debug("Proxying to Google Maps API: #{url}")
        
        # 发送请求到Google
        case HTTPoison.get(url, [], [follow_redirect: true, timeout: 10000, recv_timeout: 10000]) do
          {:ok, response} ->
            # 设置适当的内容类型
            content_type = get_content_type(endpoint, response.headers)
            
            # 返回Google的响应
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
        
        # 为开发环境提供明确的错误信息
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

  # 检查是否允许访问请求的端点
  defp allowed_endpoint?(endpoint) when is_list(endpoint) do
    # 将列表转换为字符串路径
    endpoint_path = Enum.join(endpoint, "/")
    Enum.any?(@supported_endpoints, &String.starts_with?(endpoint_path, &1))
  end
  
  defp allowed_endpoint?(endpoint) when is_binary(endpoint) do
    Enum.any?(@supported_endpoints, &String.starts_with?(endpoint, &1))
  end
  
  defp allowed_endpoint?(_), do: false

  # 构建Google Maps API URL
  defp build_google_url(endpoint, params, api_key) when is_list(endpoint) do
    # 将列表转换为字符串路径
    endpoint_path = Enum.join(endpoint, "/")
    build_google_url(endpoint_path, params, api_key)
  end
  
  defp build_google_url(endpoint, params, api_key) when is_binary(endpoint) do
    base_url = "https://maps.googleapis.com/#{endpoint}"
    
    # 从原始请求中获取查询参数
    query_params = params
                   |> Map.drop(["endpoint"]) # 移除我们的路由参数
                   |> Map.put("key", api_key) # 添加API密钥
                   |> URI.encode_query()
    
    "#{base_url}?#{query_params}"
  end

  # 确定适当的内容类型
  defp get_content_type(endpoint, headers) do
    # 从Google响应头中提取内容类型
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