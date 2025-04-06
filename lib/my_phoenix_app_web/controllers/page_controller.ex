defmodule MyPhoenixAppWeb.PageController do
  use MyPhoenixAppWeb, :controller

  def home(conn, _params) do
    # Redirect to provider page to avoid users seeing the default Phoenix page
    conn
    |> redirect(to: ~p"/providers")
    |> halt()
  end
end
