use gdal::Dataset;
use std::path::Path;
use std::env;


#[derive(Debug)]
struct Country {
    total_population: f64,
    weighted_lat: f64,
    weighted_lon: f64,
}

fn process_geotiff(path: &Path) -> Result<Country, Box<dyn std::error::Error>> {
    let dataset = Dataset::open(path)?;
    let band = dataset.rasterband(1)?;
    let (width, height) = band.size();

    let geo_transform = dataset.geo_transform()?;

    let mut total_population = 0.0;
    let mut weighted_lat = 0.0;
    let mut weighted_lon = 0.0;

    let buffer = band.read_as::<f32>(
        (0, 0),
        (width, height),
        (width, height),
        None,
    )?;

    let data = buffer.data();
    let nodata_value = band.no_data_value();

    for j in 0..height {
        for i in 0..width {
            let idx = (j * width + i) as usize;
            let value = data[idx] as f64;

            if value < 0.0 || nodata_value.map_or(false, |nd| (value - nd).abs() < std::f64::EPSILON) {
                continue;
            }

            let lon = geo_transform[0] + (i as f64) * geo_transform[1];
            let lat = geo_transform[3] + (j as f64) * geo_transform[5];

            total_population += value;
            weighted_lat += lat * value;
            weighted_lon += lon * value;
        }
    }


    let country = Country {
        total_population,
        weighted_lat: weighted_lat / total_population,
        weighted_lon: weighted_lon / total_population,
    };

    Ok(country)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = env::args().collect();
    let result = process_geotiff(Path::new(&args[1]))?;
    //println!("country_file;total_population;weighted_lat;weighted_lon");
    if result.total_population > 0.0 {
        println!("{};{:.15};{:.15};{:.15}", &args[1], result.total_population, result.weighted_lat, result.weighted_lon);
    }
    Ok(())
}
