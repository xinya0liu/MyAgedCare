defmodule MyPhoenixAppWeb.ProviderLive do
  use MyPhoenixAppWeb, :live_view
  alias MyPhoenixApp.Providers.AgedCareProvider
  require Logger

  @impl true
  def mount(_params, _session, socket) do
    Logger.debug("Mounting ProviderLive")
    
    # 获取 Google Maps API 密钥
    google_maps_api_key = Application.get_env(:my_phoenix_app, :google_maps_api_key)
    Logger.debug("Google Maps API key from config: #{inspect(google_maps_api_key)}")
    
    if connected?(socket) do
      Logger.debug("Socket connected")
      # 使用默认位置加载初始数据
      default_location = %{latitude: -27.695, longitude: 153.222} # Brisbane
      providers = AgedCareProvider.list_nearby(
        default_location.latitude,
        default_location.longitude,
        5
      ) |> MyPhoenixApp.Repo.all()
      
      Logger.debug("Found #{length(providers)} providers near default location")
      
      # 默认选择第一个提供商
      default_provider = List.first(providers)

      {:ok,
       socket
       |> assign(:providers, providers)
       |> assign(:selected_provider, default_provider)
       |> assign(:loading, false)
       |> assign(:current_location, default_location)
       |> assign(:api_key_valid, true)
       |> assign(:has_unread_notification, true)}
    else
      Logger.debug("Socket not connected")
      {:ok,
       socket
       |> assign(:providers, [])
       |> assign(:selected_provider, nil)
       |> assign(:loading, true)
       |> assign(:current_location, nil)
       |> assign(:api_key_valid, true)
       |> assign(:has_unread_notification, true)}
    end
  end

  @impl true
  def handle_event("select-provider", %{"id" => id}, socket) do
    Logger.debug("Selecting provider #{id}")
    provider = Enum.find(socket.assigns.providers, &(&1.id == String.to_integer(id)))
    {:noreply, assign(socket, :selected_provider, provider)}
  end

  @impl true
  def handle_event("update-location", params, socket) do
    Logger.debug("Received update-location event: #{inspect(params)}")
    
    # 提取参数
    {latitude, longitude, distances} = case params do
      %{"latitude" => lat, "longitude" => lng, "provider_distances" => distances} ->
        Logger.debug("Received provider_distances: #{inspect(distances)}")
        {parse_float(lat), parse_float(lng), distances}
      
      %{"latitude" => lat, "longitude" => lng} ->
        Logger.debug("No distances received, using default")
        {parse_float(lat), parse_float(lng), %{}}
      
      _ ->
        Logger.error("Invalid params for update-location: #{inspect(params)}")
        {nil, nil, %{}}
    end
    
    if is_nil(latitude) or is_nil(longitude) do
      Logger.error("Invalid coordinates: lat=#{inspect(latitude)}, lng=#{inspect(longitude)}")
      {:noreply, socket}
    else
      Logger.debug("Updating location: lat=#{latitude}, lng=#{longitude}")
      Logger.debug("Received distances: #{inspect(distances)}")
      
      # 先设置加载状态
      socket = assign(socket, :loading, true)
      
      # 获取新位置附近的提供商
      providers = 
        try do
          AgedCareProvider.list_nearby(latitude, longitude, 5) 
          |> MyPhoenixApp.Repo.all()
          |> Enum.map(fn provider ->
            # 从前端获取的距离数据中获取对应的距离
            distance = case get_provider_distance(distances, provider.id) do
              {:ok, dist} -> 
                Logger.debug("Setting distance for provider #{provider.id} to #{dist}m")
                dist
              {:error, reason} -> 
                Logger.warning("Failed to get distance for provider #{provider.id}: #{reason}")
                provider.distance || 0
            end
            
            Logger.debug("Final distance for provider #{provider.id}: #{inspect(distance)}")
            %{provider | distance: distance}
          end)
        rescue
          e ->
            Logger.error("Error fetching providers: #{inspect(e)}")
            []
        end
      
      Logger.debug("Found #{length(providers)} providers near location")
      
      # 如果有提供商，默认选择第一个
      default_provider = if length(providers) > 0, do: List.first(providers), else: nil
      
      {:noreply,
       socket
       |> assign(:current_location, %{latitude: latitude, longitude: longitude})
       |> assign(:providers, providers)
       |> assign(:selected_provider, default_provider)
       |> assign(:loading, false)}
    end
  end
  
  # 解析浮点数，处理错误情况
  defp parse_float(value) when is_binary(value) do
    case Float.parse(value) do
      {float, _} -> float
      :error -> nil
    end
  end
  
  defp parse_float(value) when is_float(value), do: value
  defp parse_float(value) when is_integer(value), do: value / 1
  defp parse_float(_), do: nil
  
  # 获取提供商距离
  defp get_provider_distance(distances, provider_id) do
    # 尝试不同的键格式
    provider_key = to_string(provider_id)
    
    Logger.debug("Looking for distance with key '#{provider_key}' in distances map")
    Logger.debug("Available keys: #{inspect(Map.keys(distances))}")
    
    case get_in(distances, [provider_key]) do
      nil -> 
        Logger.warning("No distance found for provider #{provider_id}")
        {:error, :not_found}
        
      distance when is_number(distance) -> 
        Logger.debug("Using number distance #{distance} for provider #{provider_id}")
        {:ok, distance}
        
      distance when is_binary(distance) -> 
        Logger.debug("Converting string distance #{distance} for provider #{provider_id}")
        case Float.parse(distance) do
          {value, _} -> {:ok, value}
          :error -> {:error, :parse_error}
        end
        
      distance -> 
        Logger.warning("Invalid distance format for provider #{provider_id}: #{inspect(distance)}")
        {:error, :invalid_format}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="w-full h-full flex flex-col">
      <div class="flex flex-col h-screen">
        <header class="py-3 flex flex-wrap justify-between items-center border-b px-3 shadow-sm bg-white" id="notification-header" phx-hook="NotificationHook">
          <div class="flex items-center w-full sm:w-auto justify-between sm:justify-start mb-2 sm:mb-0">
            <div class="flex items-center">
              <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-sm mr-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="font-bold text-lg">MyAgedCare</span>
              </div>
            </div>
            <nav class="flex sm:ml-4">
              <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base font-medium px-2 py-1 rounded hover:bg-blue-50">Find A Provider</a>
              <a href="#" class="ml-3 md:ml-5 text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base font-medium px-2 py-1 rounded hover:bg-blue-50">Contact Us</a>
            </nav>
            <div class="flex items-center sm:hidden">
              <div class="relative mr-3">
                <button phx-click="toggle-notification" id="notification-btn-mobile" class="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  <.icon name="hero-bell" class="h-5 w-5 text-gray-600" />
                  <%= if @has_unread_notification do %>
                    <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600 ring-1 ring-white"></span>
                  <% end %>
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-center w-full sm:w-auto justify-end">
            <div class="relative mr-4 hidden sm:block">
              <button phx-click="toggle-notification" id="notification-btn" class="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <.icon name="hero-bell" class="h-6 w-6 text-gray-600" />
                <%= if @has_unread_notification do %>
                  <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600 ring-1 ring-white"></span>
                <% end %>
              </button>
              <div id="notification-dropdown" class="hidden absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-10 p-2">
                <div class="p-3 border-b">
                  <h3 class="font-semibold">Notifications</h3>
                </div>
                <div class="p-3">
                  <div class="flex items-start mb-2">
                    <div class="bg-blue-100 p-2 rounded-full mr-2">
                      <.icon name="hero-information-circle" class="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p class="text-sm font-medium">Test Notification</p>
                      <p class="text-xs text-gray-500">This is a test notification message</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center bg-gray-50 px-3 py-1.5 rounded-full shadow-sm">
              <img src="/images/xinya.jpg" class="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-blue-100 mr-2" alt="Xinya Liu" />
              <span class="font-medium text-sm sm:text-base text-gray-800">Xinya Liu</span>
            </div>
          </div>
        </header>

        <div class="flex-1 flex flex-col">
          <div class="py-2 text-center w-full">
            <h1 class="text-xl font-semibold text-blue-800">Aged Care Providers Near Me</h1>
          </div>

          <div class="flex-1 overflow-hidden">
            <div class="relative min-h-[250px] md:min-h-[300px] bg-gray-100 rounded-lg mx-0 my-4 sm:my-6">
              <!-- 地图加载占位符 -->
              <%= if @loading do %>
                <div class="absolute inset-0 flex justify-center items-center bg-gray-100 rounded-lg z-10">
                  <.spinner />
                </div>
              <% end %>
              <!-- 地图容器 -->
              <div id="map" phx-hook="MapHook" 
                   data-api-proxy-url="/api/google/maps"
                   data-providers={Jason.encode!(Enum.map(@providers, fn p -> 
                     if is_float(p.latitude) and is_float(p.longitude) do
                       "#{p.id}|#{p.latitude}|#{p.longitude}|#{p.name}"
                     else
                       nil
                     end
                   end) |> Enum.filter(&(&1 != nil)))}
                   class="w-full h-[300px] md:h-[400px] rounded-lg relative"
                   style="width: 100%; height: 300px; min-height: 300px; position: relative; overflow: hidden; border: 1px solid #ddd; border-radius: 0.5rem; background-color: #f8f9fa;">
                <!-- 地图加载指示器 -->
                <div id="map-loading-indicator" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                  <div class="text-center">
                    <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p class="text-gray-700 font-medium">正在加载地图...</p>
                    <p class="text-gray-500 text-sm mt-1">请稍候</p>
                  </div>
                </div>
                <!-- 地图错误提示 (初始隐藏) -->
                <div id="map-error" class="hidden absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
                  <div class="text-center p-4 max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 class="text-red-600 font-semibold text-lg mb-1">地图加载失败</h3>
                    <p class="text-gray-700" id="map-error-message">无法加载地图，请刷新页面重试。</p>
                    <button onclick="window.location.reload()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                      刷新页面
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Provider list -->
            <div class="mt-1">
              <%= if @loading do %>
                <div class="flex justify-center items-center h-full">
                  <.spinner />
                </div>
              <% else %>
                <!-- Provider list area -->
                <div class="flex flex-col md:flex-row">
                  <!-- Left list -->
                  <div class="w-full md:w-[45%] overflow-y-auto pr-0 md:pr-2 border-b md:border-b-0 md:border-r max-h-[300px] md:max-h-[calc(100vh-400px)]">
                    <%= for provider <- @providers do %>
                      <div class="provider-card bg-white p-3 border-b cursor-pointer hover:bg-gray-50 transition-all duration-300"
                           phx-click="select-provider"
                           phx-value-id={provider.id}>
                        <div class="flex items-start">
                          <div class="w-16 h-16 sm:w-20 sm:h-20 min-w-[4rem] min-h-[4rem] sm:min-w-[5rem] sm:min-h-[5rem] bg-gray-100 rounded overflow-hidden">
                            <img src={"/images/provider_#{provider.id}.jpg"} class="w-full h-full object-cover" onerror="this.src='/images/aged-care-default.jpg'" alt={provider.name} />
                          </div>
                          <div class="ml-2 sm:ml-3 flex-1">
                            <h3 class="font-semibold text-sm sm:text-base truncate"><%= provider.name %></h3>
                            <p class="text-xs sm:text-sm text-gray-600 truncate">
                              <%= case provider.id do %>
                                <% 1 -> %>Premium Aged Care
                                <% 2 -> %>Community-Focused Care
                                <% 3 -> %>Memory Care Specialists
                                <% 4 -> %>Culturally Diverse Care
                                <% 5 -> %>Boutique Aged Care
                                <% _ -> %>Aged Care Facility
                              <% end %>
                            </p>
                            <p class="text-sm text-gray-500 mt-1">
                              <%= format_distance(provider.distance) %> • 
                              <%= case provider.id do %>
                                <% 1 -> %>4.9 ★
                                <% 2 -> %>4.7 ★
                                <% 3 -> %>4.8 ★
                                <% 4 -> %>4.6 ★
                                <% 5 -> %>4.9 ★
                                <% _ -> %>4.5 ★
                              <% end %>
                            </p>
                            <%= if provider.care_types && length(provider.care_types) > 0 do %>
                              <div class="flex flex-wrap gap-1 mt-1">
                                <%= for care_type <- Enum.take(provider.care_types, 2) do %>
                                  <%= case care_type do %>
                                    <% "High Care" -> %>
                                      <span class="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Low Care" -> %>
                                      <span class="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Dementia Care" -> %>
                                      <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Palliative Care" -> %>
                                      <span class="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Respite Care" -> %>
                                      <span class="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Independent Living" -> %>
                                      <span class="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Residential Care" -> %>
                                      <span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs"><%= care_type %></span>
                                    <% "Couples Accommodation" -> %>
                                      <span class="px-1.5 py-0.5 bg-pink-100 text-pink-800 rounded-full text-xs"><%= care_type %></span>
                                    <% _ -> %>
                                      <span class="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded-full text-xs"><%= care_type %></span>
                                  <% end %>
                                <% end %>
                                <%= if length(provider.care_types) > 2 do %>
                                  <span class="px-1.5 py-0.5 text-gray-500 text-xs">+<%= length(provider.care_types) - 2 %> more</span>
                                <% end %>
                              </div>
                            <% end %>
                          </div>
                        </div>
                      </div>
                    <% end %>
                  </div>
                  
                  <!-- Right details -->
                  <%= if @selected_provider do %>
                    <div class="w-full md:w-[55%] pl-0 md:pl-3 mt-3 md:mt-0">
                      <div class="bg-white p-3 rounded-lg overflow-y-auto max-h-[calc(100vh-400px)]">
                        <div class="flex items-center mb-3">
                          <div class="w-14 h-14 sm:w-16 sm:h-16 min-w-[3.5rem] min-h-[3.5rem] sm:min-w-[4rem] sm:min-h-[4rem] bg-gray-100 rounded-lg overflow-hidden mr-2 sm:mr-3">
                            <img src={"/images/provider_#{@selected_provider.id}.jpg"} class="w-full h-full object-cover" onerror="this.src='/images/aged-care-default.jpg'" alt={@selected_provider.name} />
                          </div>
                          <div class="flex-1">
                            <h2 class="text-base sm:text-lg font-semibold truncate"><%= @selected_provider.name %></h2>
                            <p class="text-gray-700 text-xs sm:text-sm truncate">
                              <%= case @selected_provider.id do %>
                                <% 1 -> %>Premium Aged Care
                                <% 2 -> %>Community-Focused Care
                                <% 3 -> %>Memory Care Specialists
                                <% 4 -> %>Culturally Diverse Care
                                <% 5 -> %>Boutique Aged Care
                                <% _ -> %>Aged Care Facility
                              <% end %>
                            </p>
                          </div>
                        </div>
                        
                        <p class="text-gray-700 mb-4 text-sm">
                          <%= case @selected_provider.id do %>
                            <% 1 -> %>
                              We are an NDIS certified premium aged care provider with over 25 years of experience. Our facilities feature state-of-the-art medical equipment and a team of highly qualified healthcare professionals dedicated to providing exceptional care.
                            <% 2 -> %>
                              Our community-focused aged care facility emphasizes creating a homelike environment where residents can maintain their independence while receiving necessary support. We pride ourselves on our friendly staff and family-oriented approach.
                            <% 3 -> %>
                              Specializing in dementia and Alzheimer's care, our facility offers a secure and compassionate environment with specialized programs designed to enhance cognitive function and quality of life for residents with memory challenges.
                            <% 4 -> %>
                              As a culturally diverse aged care provider, we celebrate different traditions and customs, offering multilingual staff and culturally appropriate care. Our facility is designed to make residents from all backgrounds feel welcome and understood.
                            <% 5 -> %>
                              Our boutique aged care residence provides personalized care in a luxurious setting. With a high staff-to-resident ratio, we ensure each individual receives attentive care tailored to their specific needs and preferences.
                            <% _ -> %>
                              We are an NDIS certified aged care provider, offering quality healthcare services. Our facilities provide professional care and support tailored to individual needs, ensuring safety and comfort for all residents.
                          <% end %>
                        </p>
                        
                        <div class="mb-3">
                          <h3 class="font-medium mb-1 text-sm">Care Types</h3>
                          <div class="flex flex-wrap gap-1">
                            <%= if @selected_provider.care_types do %>
                              <%= for care_type <- @selected_provider.care_types do %>
                                <%= case care_type do %>
                                  <% "High Care" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Low Care" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Dementia Care" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Palliative Care" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Respite Care" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-rose-100 text-rose-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Independent Living" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-teal-100 text-teal-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Residential Care" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"><%= care_type %></span>
                                  <% "Couples Accommodation" -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-pink-100 text-pink-800 rounded-full text-xs"><%= care_type %></span>
                                  <% _ -> %>
                                    <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-200 text-gray-800 rounded-full text-xs"><%= care_type %></span>
                                <% end %>
                              <% end %>
                            <% else %>
                              <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-200 text-gray-800 rounded-full text-xs">Residential</span>
                              <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-200 text-gray-800 rounded-full text-xs">Home Care</span>
                            <% end %>
                          </div>
                        </div>
                        
                        <div class="mb-3">
                          <h3 class="font-medium mb-1 text-sm">Services</h3>
                          <p class="text-gray-700 text-sm">
                            <%= case @selected_provider.id do %>
                              <% 1 -> %>
                                24/7 Nursing Care, Specialist Medical Services, Rehabilitation Programs, Hydrotherapy, Private Rooms with Ensuite
                              <% 2 -> %>
                                Personal Care, Medication Management, Social Activities, Transport Services, Gardening Programs
                              <% 3 -> %>
                                Memory Therapy, Secure Grounds, Specialized Diet Planning, Cognitive Stimulation Programs, Family Support Groups
                              <% 4 -> %>
                                Multilingual Care Staff, Cultural Events & Celebrations, Traditional Meals, Interpreter Services, Religious Support
                              <% 5 -> %>
                                Private Suites, Personal Caregivers, Gourmet Dining, Wellness Programs, Concierge Services
                              <% _ -> %>
                                Medical Support, Meals, Social Activities
                            <% end %>
                          </p>
                        </div>
                        
                        <div class="mb-3">
                          <h3 class="font-medium mb-1 text-sm">Address</h3>
                          <p class="text-gray-700 text-sm"><%= @selected_provider.address %></p>
                        </div>
                        
                        <div class="mb-3">
                          <h3 class="font-medium mb-1 text-sm">Phone</h3>
                          <p class="text-gray-700 text-sm"><%= @selected_provider.phone || "0400 000 000" %></p>
                        </div>
                        
                        <button class="bg-blue-700 hover:bg-blue-800 w-full text-white py-2 px-4 rounded-lg transition-colors mt-2 text-sm">
                          Book A Tour
                        </button>
                      </div>
                    </div>
                  <% end %>
                </div>
              <% end %>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <footer class="bg-gradient-to-r from-gray-50 to-blue-50 py-3 sm:py-4 border-t mt-auto shadow-inner">
          <div class="max-w-screen-xl mx-auto px-3 sm:px-4">
            <!-- Main Footer Area -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
              <!-- Brand Area -->
              <div class="flex sm:flex-col items-center sm:items-start space-x-3 sm:space-x-0">
                <div class="hidden sm:flex items-center mb-2">
                  <div class="bg-blue-600 text-white px-2 py-1 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span class="font-bold text-sm">MyAgedCare</span>
                  </div>
                </div>
                
                <p class="text-xs text-gray-600 text-center sm:text-left mb-2">Providing quality aged care services across Australia since 2002</p>
                
                <!-- Social Links -->
                <div class="flex space-x-2 mt-1 sm:mt-0">
                  <a href="#" class="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" class="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                  <a href="#" class="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.259-.012 3.668-.069 4.948-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              <!-- Contact Info -->
              <div class="flex flex-col items-center sm:items-start">
                <h3 class="font-semibold text-blue-800 text-xs uppercase mb-1 sm:mb-2">Contact</h3>
                <div class="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-1.5">
                  <a href="mailto:MyAgedCare@gmail.com" class="flex items-center hover:text-blue-600 transition-colors group text-xs">
                    <span class="flex items-center justify-center bg-blue-100 text-blue-500 p-1 rounded mr-1.5 w-5 h-5 group-hover:bg-blue-200 transition-colors">
                      <.icon name="hero-envelope" class="h-3 w-3" />
                    </span>
                    <span>MyAgedCare@gmail.com</span>
                  </a>
                  <a href="tel:+61000000000" class="flex items-center hover:text-blue-600 transition-colors group text-xs">
                    <span class="flex items-center justify-center bg-blue-100 text-blue-500 p-1 rounded mr-1.5 w-5 h-5 group-hover:bg-blue-200 transition-colors">
                      <.icon name="hero-phone" class="h-3 w-3" />
                    </span>
                    <span>+61 000 000 000</span>
                  </a>
                </div>
              </div>
              
              <!-- Services & Links -->
              <div class="flex flex-col items-center sm:items-start">
                <h3 class="font-semibold text-blue-800 text-xs uppercase mb-1 sm:mb-2">Services</h3>
                <div class="grid grid-cols-2 gap-2 sm:gap-1.5">
                  <a href="#" class="flex items-center hover:text-blue-600 transition-colors group text-xs">
                    <span class="flex items-center justify-center bg-blue-100 text-blue-500 p-1 rounded mr-1.5 w-5 h-5 group-hover:bg-blue-200 transition-colors">
                      <.icon name="hero-map" class="h-3 w-3" />
                    </span>
                    <span>Find A Provider</span>
                  </a>
                  <a href="#" class="flex items-center hover:text-blue-600 transition-colors group text-xs">
                    <span class="flex items-center justify-center bg-blue-100 text-blue-500 p-1 rounded mr-1.5 w-5 h-5 group-hover:bg-blue-200 transition-colors">
                      <.icon name="hero-home" class="h-3 w-3" />
                    </span>
                    <span>Home Care</span>
                  </a>
                  <a href="#" class="flex items-center hover:text-blue-600 transition-colors group text-xs">
                    <span class="flex items-center justify-center bg-blue-100 text-blue-500 p-1 rounded mr-1.5 w-5 h-5 group-hover:bg-blue-200 transition-colors">
                      <.icon name="hero-information-circle" class="h-3 w-3" />
                    </span>
                    <span>NDIS Support</span>
                  </a>
                  <a href="#" class="flex items-center hover:text-blue-600 transition-colors group text-xs">
                    <span class="flex items-center justify-center bg-blue-100 text-blue-500 p-1 rounded mr-1.5 w-5 h-5 group-hover:bg-blue-200 transition-colors">
                      <.icon name="hero-speaker-wave" class="h-3 w-3" />
                    </span>
                    <span>Accessibility</span>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Copyright Area -->
            <div class="flex flex-col sm:flex-row justify-between items-center text-xs pt-3 mt-3 border-t border-gray-200">
              <div class="mb-2 sm:mb-0">
                <span class="text-gray-600 font-medium">© 2025 My Aged Care</span>
              </div>
              <div class="flex flex-wrap justify-center gap-3">
                <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors text-xs">Privacy</a>
                <span class="hidden sm:inline text-gray-400">|</span>
                <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors text-xs">Terms</a>
                <span class="hidden sm:inline text-gray-400">|</span>
                <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors text-xs">Accessibility</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    """
  end

  def spinner(assigns) do
    ~H"""
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    """
  end

  @impl true
  def handle_event("refresh-data", _params, socket) do
    Logger.debug("Refreshing data")
    default_location = socket.assigns.current_location || %{latitude: -27.695, longitude: 153.222}
    
    providers = AgedCareProvider.list_nearby(
      default_location.latitude,
      default_location.longitude,
      5
    ) |> MyPhoenixApp.Repo.all()
    
    Logger.debug("Refreshed data, found #{length(providers)} providers")
    
    {:noreply, assign(socket, :providers, providers)}
  end
  
  @impl true
  def handle_event("reset-map", _params, socket) do
    Logger.debug("Resetting map")
    default_location = %{latitude: -27.695, longitude: 153.222} # Brisbane
    
    providers = AgedCareProvider.list_nearby(
      default_location.latitude,
      default_location.longitude,
      5
    ) |> MyPhoenixApp.Repo.all()
    
    # 默认选择第一个提供商
    default_provider = if length(providers) > 0, do: List.first(providers), else: nil
    
    {:noreply, 
     socket
     |> assign(:current_location, default_location)
     |> assign(:providers, providers)
     |> assign(:selected_provider, default_provider)}
  end

  @impl true
  def handle_event("toggle-notification", _params, socket) do
    {:noreply, 
     socket 
     |> assign(:has_unread_notification, false)
     |> push_event("toggle-notification", %{})}
  end

  # 格式化距离显示
  defp format_distance(nil), do: "-- m"
  defp format_distance(0), do: "-- m"
  defp format_distance(distance) when distance < 1, do: "< 1 m" 
  defp format_distance(distance) when distance < 1000, do: "#{Float.round(distance, 1)} m"
  defp format_distance(distance), do: "#{Float.round(distance / 1000, 2)} km"
end 