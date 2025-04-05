defmodule MyPhoenixAppWeb.ApiController do
  use MyPhoenixAppWeb, :controller

  alias MyPhoenixApp.Providers

  @doc """
  返回离指定位置最近的提供商
  需要参数:
  - lat: 纬度
  - lng: 经度
  - radius: 搜索半径(公里)，默认为50km
  """
  def nearby_providers(conn, params) do
    # 解析参数
    with {:ok, lat} <- parse_float(params["lat"]),
         {:ok, lng} <- parse_float(params["lng"]),
         {:ok, radius} <- parse_radius(params["radius"]) do
      
      # 打印信息用于调试
      IO.puts("查询位置附近的提供商: 纬度#{lat}, 经度#{lng}, 半径#{radius}公里")
      
      # 获取附近的提供商
      providers = Providers.list_nearby_providers(lat, lng, radius)
      
      # 返回JSON响应
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
        # 处理无效参数的错误
        conn
        |> put_status(400)
        |> json(%{
          success: false,
          error: "无效的#{field}: #{message}"
        })
    end
  end

  @doc """
  根据ID获取单个提供商信息
  """
  def get_provider(conn, %{"id" => id}) do
    case parse_id(id) do
      {:ok, provider_id} ->
        case Providers.get_provider(provider_id) do
          nil ->
            conn
            |> put_status(404)
            |> json(%{success: false, error: "提供商不存在"})
          
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

  # 辅助函数: 解析ID
  defp parse_id(id) when is_integer(id), do: {:ok, id}
  defp parse_id(id) when is_binary(id) do
    case Integer.parse(id) do
      {num, ""} -> {:ok, num}
      _ -> {:error, "ID必须是有效的整数"}
    end
  end
  defp parse_id(_), do: {:error, "无效的ID格式"}

  # 辅助函数: 解析浮点数
  defp parse_float(nil), do: {:error, "lat/lng", "参数不能为空"}
  defp parse_float(value) when is_number(value), do: {:ok, value}
  defp parse_float(value) when is_binary(value) do
    case Float.parse(value) do
      {num, _} -> {:ok, num}
      :error -> {:error, "lat/lng", "必须是有效的数字"}
    end
  end
  defp parse_float(_), do: {:error, "lat/lng", "无效的格式"}

  # 辅助函数: 解析并验证搜索半径
  defp parse_radius(nil), do: {:ok, 50.0}  # 默认50公里
  defp parse_radius(value) when is_number(value) do
    cond do
      value <= 0 -> {:error, "radius", "必须大于0"}
      value > 500 -> {:ok, 500.0}  # 限制最大半径为500公里
      true -> {:ok, value}
    end
  end
  defp parse_radius(value) when is_binary(value) do
    case Float.parse(value) do
      {num, _} ->
        cond do
          num <= 0 -> {:error, "radius", "必须大于0"}
          num > 500 -> {:ok, 500.0}  # 限制最大半径
          true -> {:ok, num}
        end
      :error -> {:error, "radius", "必须是有效的数字"}
    end
  end
  defp parse_radius(_), do: {:error, "radius", "无效的格式"}
end