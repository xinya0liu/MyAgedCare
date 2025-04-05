defmodule MyPhoenixApp.Providers.AgedCareProvider do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  schema "aged_care_providers" do
    field :name, :string
    field :description, :string
    field :address, :string
    field :phone, :string
    field :latitude, :float
    field :longitude, :float
    field :services, {:array, :string}
    field :care_types, {:array, :string}
    field :distance, :float
    field :image_url, :string

    timestamps()
  end

  def changeset(provider, attrs) do
    provider
    |> cast(attrs, [:name, :description, :address, :phone, :latitude, :longitude, :services, :care_types, :distance, :image_url])
    |> validate_required([:name, :address])
  end

  def list_nearby(latitude, longitude, distance_in_km) do
    from(p in __MODULE__,
      where: fragment(
        "ST_Distance(ST_MakePoint(?, ?), ST_MakePoint(longitude, latitude)) <= ?",
        ^longitude,
        ^latitude,
        ^(distance_in_km * 1000)
      ),
      select: %{
        p |
        distance:
          fragment(
            "ST_Distance(ST_MakePoint(?, ?), ST_MakePoint(longitude, latitude))",
            ^longitude,
            ^latitude
          )
      },
      order_by: fragment(
        "ST_Distance(ST_MakePoint(?, ?), ST_MakePoint(longitude, latitude))",
        ^longitude,
        ^latitude
      )
    )
  end
end 