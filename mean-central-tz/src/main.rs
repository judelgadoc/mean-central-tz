use geotiff::GeoTiff;
use std::fs::File;
use std::path::Path;
use geo_types::Coord;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(Path::new("geotiff.tif"))?;
    let geo = GeoTiff::read(file)?;

    let width = geo.raster_width as usize;
    let height = geo.raster_height as usize;

    // Use model extent to get top-left and bottom-right
    let extent = geo.model_extent();
    let min_x = extent.min().x;
    let max_y = extent.max().y;

    // Compute scale (assuming evenly spaced pixels and no rotation)
    let scale_x = (extent.max().x - extent.min().x) / (width as f64);
    let scale_y = (extent.max().y - extent.min().y) / (height as f64);

    let mut total_population = 0.0;
    let mut mean_lon = 0.0;
    let mut mean_lat = 0.0;

    for j in 0..height {
        for i in 0..width {
            let lon = min_x + i as f64 * scale_x;
            let lat = max_y - j as f64 * scale_y;

            let coord = Coord { x: lon, y: lat };
            let result: f64 = geo.get_value_at(&coord, 0).unwrap();

            if result >= 0.0 {
                total_population = total_population + result;
                mean_lon = mean_lon + lon*result;
                mean_lat = mean_lat + lat*result;
            }
        }
    }
    println!("{:.6}, {:.6} => {}", mean_lat/total_population, mean_lon/total_population, total_population);

    Ok(())
}

