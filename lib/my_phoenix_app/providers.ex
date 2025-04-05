defmodule MyPhoenixApp.Providers do
  @moduledoc """
  提供商服务上下文
  处理与aged care providers相关的业务逻辑
  """

  import Ecto.Query
  alias MyPhoenixApp.Repo
  alias MyPhoenixApp.Providers.AgedCareProvider

  @doc """
  列出靠近给定位置的提供商
  计算点到点的距离，并按距离排序
  
  ## 参数
  
    - latitude: 用户位置的纬度
    - longitude: 用户位置的经度
    - radius: 搜索半径(千米)
  
  ## 返回值
  
  返回格式化的提供商列表，每个都包含距离信息
  """
  def list_nearby_providers(latitude, longitude, radius) when is_number(latitude) and is_number(longitude) do
    # 构建查询
    query = AgedCareProvider.list_nearby(latitude, longitude, radius)
    
    # 执行查询
    providers = Repo.all(query)
    
    # 处理结果
    providers
    |> Enum.map(fn provider ->
      # 计算可读的距离
      readable_distance = 
        case provider.distance do
          d when d < 1000 -> "#{round(d)}米"
          d -> "#{Float.round(d / 1000, 1)}公里"
        end
      
      # 构建API响应格式
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
  获取单个提供商详情
  
  ## 参数
  
    - id: 提供商ID
  
  ## 返回值
  
  返回单个提供商详情，如果未找到则返回nil
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