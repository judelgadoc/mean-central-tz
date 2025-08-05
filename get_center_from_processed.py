import polars as pl

df = pl.read_csv("processed_data.csv", separator=";")

weighted_lat_sum = (pl.col("total_population") * pl.col("weighted_lat")).sum().alias("weighted_lat_sum")
weighted_lon_sum = (pl.col("total_population") * pl.col("weighted_lon")).sum().alias("weighted_lon_sum")
pop_sum = pl.col("total_population").sum().alias("pop_sum")

result = df.select([
    (weighted_lat_sum / pop_sum).alias("resultLat"),
    (weighted_lon_sum / pop_sum).alias("resultLon"),
])

print(result)

