defmodule MyPhoenixApp.Repo.Migrations.CreateAgedCareProviders do
  use Ecto.Migration

  def change do
    create table(:aged_care_providers) do
      add :name, :string, null: false
      add :description, :text
      add :address, :string, null: false
      add :phone, :string
      add :latitude, :float
      add :longitude, :float
      add :services, {:array, :string}
      add :care_types, {:array, :string}
      add :distance, :float
      add :image_url, :string

      timestamps()
    end

    create index(:aged_care_providers, [:latitude, :longitude])
  end
end 