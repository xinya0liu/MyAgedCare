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

  # 每分钟API调用次数限制
  @rate_limit 60

  # 代理Google Maps API请求
  def proxy(conn, params) do
    endpoint = params["endpoint"]
    
    # 1. 验证 HTTP Referer
    if valid_referer?(conn) do
      # 2. 检查是否允许访问的端点
      if allowed_endpoint?(endpoint) do
        # 3. 应用速率限制
        if check_rate_limit(conn) do
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
                
                # 添加安全响应头
                conn = add_security_headers(conn)
                
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
          Logger.warning("Rate limit exceeded for Google Maps API request", 
            %{ip: client_ip(conn), endpoint: endpoint})
          
          conn
          |> put_status(:too_many_requests)
          |> json(%{error: "Rate limit exceeded. Please try again later."})
        end
      else
        Logger.warning("Attempted to access unauthorized Google Maps API endpoint: #{endpoint}", 
          %{endpoint: endpoint, ip: client_ip(conn)})
        
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Access to this Google Maps API endpoint is not allowed"})
      end
    else
      Logger.warning("Invalid referer for Google Maps API request", 
        %{referer: get_req_header(conn, "referer"), ip: client_ip(conn)})
      
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Invalid request origin"})
    end
  end

  # 验证HTTP Referer
  defp valid_referer?(conn) do
    # 获取HTTP Referer头
    referer = List.first(get_req_header(conn, "referer"))
    
    # 开发环境下放宽限制
    if Mix.env() == :dev do
      true
    else
      # 验证Referer头是否来自我们的站点
      referer && (
        String.starts_with?(referer, "https://your-domain.com") || 
        String.starts_with?(referer, "https://www.your-domain.com") ||
        String.starts_with?(referer, "http://localhost:")
      )
    end
  end
  
  # 获取客户端IP
  defp client_ip(conn) do
    forwarded_for = List.first(get_req_header(conn, "x-forwarded-for"))
    
    if forwarded_for do
      forwarded_for 
      |> String.split(",") 
      |> List.first() 
      |> String.trim()
    else
      conn.remote_ip 
      |> Tuple.to_list() 
      |> Enum.join(".")
    end
  end
  
  # 检查速率限制 - 使用ETS表存储请求计数
  defp check_rate_limit(conn) do
    ip = client_ip(conn)
    
    # 简单的ETS表基于IP的速率限制
    # 注意：在实际生产环境中，可能需要使用更健壮的解决方案，如Redis
    try do
      # 确保表存在
      if :ets.info(:google_maps_rate_limit) == :undefined do
        :ets.new(:google_maps_rate_limit, [:set, :public, :named_table])
      end
      
      current_time = System.system_time(:second)
      minute_bucket = div(current_time, 60)
      
      case :ets.lookup(:google_maps_rate_limit, {ip, minute_bucket}) do
        [] ->
          # 第一次请求，创建新条目
          :ets.insert(:google_maps_rate_limit, {{ip, minute_bucket}, 1})
          true
          
        [{{^ip, ^minute_bucket}, count}] ->
          if count < @rate_limit do
            # 增加计数
            :ets.update_counter(:google_maps_rate_limit, {ip, minute_bucket}, 1)
            true
          else
            # 超过限制
            false
          end
      end
    rescue
      e ->
        Logger.error("Error checking rate limit: #{inspect(e)}")
        # 错误时允许请求通过
        true
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
    
    # 添加时间戳以避免缓存问题 - JS API特别需要
    params = if String.contains?(endpoint, "maps/api/js") do
      Map.put(params, "v", Integer.to_string(System.os_time(:second)))
    else
      params
    end
    
    # 从原始请求中获取查询参数
    query_params = params
                   |> Map.drop(["endpoint"]) # 移除我们的路由参数
                   |> Map.put("key", api_key) # 添加API密钥
                   |> URI.encode_query()
    
    # 如果这是静态资源请求（JS, CSS），添加缓存控制
    url = "#{base_url}?#{query_params}"
    
    # 对于JS API调用，可以添加签名（如果配置了密钥）
    if endpoint == "maps/api/js" && Application.get_env(:my_phoenix_app, :google_maps_api_secret) do
      secret = Application.get_env(:my_phoenix_app, :google_maps_api_secret)
      sig = sign_url(url, secret)
      "#{url}&signature=#{sig}"
    else
      url
    end
  end
  
  # 为URL创建数字签名 (HMAC-SHA1) - 如果配置了客户端签名密钥的高级版用户
  defp sign_url(url, secret) do
    :crypto.mac(:hmac, :sha, secret, url) 
    |> Base.url_encode64(padding: false)
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
  
  # 添加安全响应头
  defp add_security_headers(conn) do
    conn
    |> put_resp_header("X-Content-Type-Options", "nosniff")
    |> put_resp_header("X-XSS-Protection", "1; mode=block")
    |> put_resp_header("Cache-Control", "public, max-age=86400") # 缓存一天，减少API调用
  end
end 