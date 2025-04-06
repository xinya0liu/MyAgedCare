defmodule MyPhoenixAppWeb.Router do
  use MyPhoenixAppWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {MyPhoenixAppWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", MyPhoenixAppWeb do
    pipe_through :browser

    get "/", PageController, :home
    live "/providers", ProviderLive, :index
  end

  # Google Maps API proxy routes
  scope "/api", MyPhoenixAppWeb do
    pipe_through :api

    # Wildcard path to capture all Google Maps API requests
    get "/google/maps/*endpoint", GoogleMapsProxyController, :proxy
    
    # Provider API interface
    get "/providers/nearby", ApiController, :nearby_providers
    get "/providers/:id", ApiController, :get_provider
  end

  # Other scopes may use custom stacks.
  # scope "/api", MyPhoenixAppWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:my_phoenix_app, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: MyPhoenixAppWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
