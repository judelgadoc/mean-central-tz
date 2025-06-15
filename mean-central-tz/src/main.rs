use std::fs::File;
use std::path::Path;
use geo_types::Coord;
use geotiff::GeoTiff;

#[derive(Debug)]
struct Country {
    total_population: f64,
    mean_lat: f64,
    mean_lon: f64,
}

/// Computes total population and weighted mean coordinate from a GeoTIFF file.
fn compute_population_center(path: &str) -> Result<Country, Box<dyn std::error::Error>> {
    let file = File::open(Path::new(path))?;
    let geo = GeoTiff::read(file)?;

    let width = geo.raster_width as usize;
    let height = geo.raster_height as usize;

    let extent = geo.model_extent();
    let min_x = extent.min().x;
    let max_y = extent.max().y;

    let scale_x = (extent.max().x - extent.min().x) / (width as f64);
    let scale_y = (extent.max().y - extent.min().y) / (height as f64);

    let mut total_population = 0.0;
    let mut weighted_lon = 0.0;
    let mut weighted_lat = 0.0;

    for j in 0..height {
        for i in 0..width {
            let lon = min_x + i as f64 * scale_x;
            let lat = max_y - j as f64 * scale_y;
            let coord = Coord { x: lon, y: lat };

            let value: f64 = geo.get_value_at(&coord, 0).unwrap();
            if value >= 0.0 {
                total_population += value;
                weighted_lon += lon * value;
                weighted_lat += lat * value;
            }
        }
    }

    if total_population == 0.0 {
        Err("Total population is zero, can't compute mean coordinates.".into())
    } else {
        Ok(Country {
            total_population,
            mean_lat: weighted_lat / total_population,
            mean_lon: weighted_lon / total_population,
        })
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let result = compute_population_center("geotiff.tif")?;
    println!("{:?}", result);
    Ok(())
}

