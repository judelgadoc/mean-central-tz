use gdal::Dataset;
use std::path::Path;
use std::io::{self, Write};
use std::fs::{self, File};
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
            weighted_lat = (weighted_lat + lat * value);
            weighted_lon = (weighted_lon + lon * value);
        }
    }

    let country = Country {
        total_population,
        weighted_lat: weighted_lat,
        weighted_lon: weighted_lon,
    };

    Ok(country)
}
 
fn process_file() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = env::args().collect();
    let result = process_geotiff(Path::new(&args[1]))?;
    //println!("country_file;total_population;weighted_lat;weighted_lon");
    if result.total_population > 0.0 {
        println!("{};{:.15};{:.15};{:.15}", &args[1], result.total_population, result.weighted_lat/result.total_population, result.weighted_lon/result.total_population);
    }
    Ok(())
}

fn process_dir() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = env::args().collect();
    let path = &args[1];
    let mut output = File::create("output.txt")?;

    let mut total_population = 0.0;
    let mut weighted_lat = 0.0;
    let mut weighted_lon = 0.0;

    writeln!(output,"country_file;total_population;weighted_lat;weighted_lon")?;
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() {
            if let Some("tif") = path.extension().and_then(|ext| ext.to_str()) {
                let result = process_geotiff(&path)?;
                    if result.total_population > 0.0 {
                        let name= path.file_name().and_then(|n| n.to_str()).unwrap();
                        writeln!(output, "{};{:.4};{:.15};{:.15}", name, result.total_population, result.weighted_lat/result.total_population, result.weighted_lon/result.total_population)?;
                        total_population += result.total_population;
                        weighted_lat += result.weighted_lat;
                        weighted_lon += result.weighted_lon;
                    }       
            }
        }
    }
    println!("Population-weighted mean coordinate: {:.15}, {:.15} for a total population of {:.0}", weighted_lat/total_population, weighted_lon/total_population, total_population);
    Ok(())
}


fn main() -> Result<(), Box<dyn std::error::Error>> {
    process_dir()
}
