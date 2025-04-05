defmodule MyPhoenixAppWeb.PageController do
  use MyPhoenixAppWeb, :controller

  def home(conn, _params) do
    # 重定向到提供商页面，避免用户看到默认的 Phoenix 页面
    conn
    |> redirect(to: ~p"/providers")
    |> halt()
  end
end
