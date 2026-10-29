# Kollayil Grama Panchayat Web GIS Portal

**Geographic Information System, Demographic Profile, Environmental Resources, Agricultural Development, Historical Background, and Disaster Management**

---

### Project Metadata
- **Project Title:** Kollayil Grama Panchayat Web GIS: Geographic Information System, Demographic Profile, Environmental Resources, Agricultural Development, Historical Background, and Disaster Management
- **Project Developer:** **HAINA .L. HERON**
- **Email:** [hainalheron2005@gmail.com](mailto:hainalheron2005@gmail.com)
- **Study Area:** Kollayil Grama Panchayat, Neyyattinkara Taluk, Thiruvananthapuram District, Kerala, India
- **Mandated Project Description:**  
  *“This Web GIS project presents the geographical, demographic, environmental, agricultural, historical, and disaster management characteristics of Kollayil Grama Panchayat using GIS datasets, interactive maps, statistical summaries, and local information.”*
- **Academic Domain:** Postgraduate Research in Geography, Cartography, and Disaster Management
- **Technologies:** Google Antigravity IDE, HTML5, CSS3, JavaScript (ES6+), Leaflet.js (v1.9.4), Chart.js (v4.4.1), QGIS 3.44 LTR

---

## 1. Project Directory Structure

```text
Kollayil Panchayat WEBGIS AI/
│
├── agricultural image.jpeg          # Original agricultural landscape photograph (Kalatharaikkal Padasekharam)
├── kollayil office.webp             # Original Kollayil Grama Panchayat office photograph
├── Kollayil Location map.qgz        # QGIS master location project
├── Kollayil open topo map.qgz       # QGIS OpenTopoMap project
├── Kollayil google image.qgz        # QGIS Google Satellite imagery project
│
├── gis_sources/                     # Preserved QGIS shapefiles, GeoTIFFs, and project files
│   ├── clippe dem.tif               # SRTM 30m Digital Elevation Model (1m to 406m elevation)
│   ├── hill shade.tif               # Shaded relief raster terrain
│   ├── slope kollayil.tif           # Slope angle raster (0° to 74.1° gradient)
│   ├── contours.shp / .dbf / .prj   # 163 contour line vectors (10m interval)
│   ├── clipped soil.shp / .dbf      # Pedological series (Red Soil & Hill Soil)
│   ├── clipped drainage.shp         # Stream network with stream orders 1 to 3
│   ├── clipped road.shp             # 29 classified road segments
│   ├── clipped geology.shp          # Precambrian bedrock lithology
│   ├── clipped geomorph.shp         # Quaternary landforms and valley fills
│   ├── kolayil fixed geometry.shp   # Boundary delimitation shapefile
│   └── kollayil ward division.qgz   # Ward division QGIS project
│
└── Kollayil_Panchayat_WebGIS_AI/    # Production Web GIS Application
    ├── index.html                   # Complete 21-section portal & analytics dashboard
    ├── README.md                    # Comprehensive scientific documentation & user guide
    ├── css/
    │   └── main-style.css           # Responsive styling with Kerala landscape palette
    ├── js/
    │   └── map-controller.js        # Leaflet map workbench, layer manager, search, and charts
    ├── data/
    │   ├── drainage.geojson         # Stream & drainage network (Stream orders 1 to 3)
    │   ├── roads.geojson            # Road transportation network (29 segments)
    │   ├── soil.geojson             # Soil classification (Red Soil & Hill Soil)
    │   ├── contours.geojson         # 163 contour isolines at 10m interval
    │   ├── geology.geojson          # Rock formations (Khondalite, Charnockite, Migmatite)
    │   ├── geomorphology.geojson    # Landforms (Plateau, Valley Fill, Ridge)
    │   ├── kollayil-wards.geojson   # Administrative delimited wards
    │   ├── facilities.geojson       # 13 Public facilities, Krishi Bhavan, ITI, Bank, PHC, Shelters
    │   └── rasters/                 # Web-accessible source GeoTIFFs
    │       ├── clippe dem.tif       # Downloadable source DEM
    │       ├── hill shade.tif       # Downloadable source Hillshade
    │       └── slope kollayil.tif   # Downloadable source Slope
    └── assets/
        └── images/
            ├── agricultural-image.jpeg      # Kalatharaikkal Padasekharam featured image
            ├── kalatharaikkal-padasekharam.jpg
            ├── kollayil-office.webp         # Panchayat office building
            └── terrain/
                ├── dem-relief.png           # High-res DEM color-relief raster overlay
                ├── hillshade.png            # Shaded relief raster overlay
                └── slope.png                # Classified slope raster overlay
```

---

## 2. Integrated QGIS Spatial Datasets

| Web GIS Layer | Source File | Geometry | Features | Source CRS &rarr; Web CRS | Key Attributes & Description |
|---|---|---|---|---|---|
| **Ward Boundaries** | `kolayil fixed geometry.shp` | Polygon | 18 / 16 | EPSG:32643 &rarr; **EPSG:4326** | `ward_no`, `ward_name`, `ward_code` (16 official wards) |
| **Drainage Network** | `clipped drainage.shp` | LineString | 13 | EPSG:32643 &rarr; **EPSG:4326** | `ORDER1` (Stream orders 1, 2, 3 draining to Neyyar) |
| **Road Network** | `clipped road.shp` | LineString | 29 | EPSG:4326 &rarr; **EPSG:4326** | `NAME`, `Length` (km) (29 classified road links) |
| **Soil Classification** | `clipped soil.shp` | Polygon | 2 | EPSG:32643 &rarr; **EPSG:4326** | `SOIL` (Red Soil: lateritic loam, Hill Soil: upland skeletal) |
| **Topographic Contours** | `contours.shp` | LineString | 163 | EPSG:4326 &rarr; **EPSG:4326** | `ELEV` (10m vertical intervals: 40m, 50m ... 350m+) |
| **Geology (Lithology)** | `clipped geology.shp` | Polygon | 7 | EPSG:32643 &rarr; **EPSG:4326** | `ROCK_GROUP`, `NAME` (Khondalite, Charnockite, Migmatite) |
| **Geomorphology** | `clipped geomorph.shp` | Polygon | 22 | EPSG:32643 &rarr; **EPSG:4326** | `NAME`, `TYPE1` (Plateau, Valley Fill, Ridges, Structural Hills) |
| **Public Facilities** | `facilities.geojson` | Point | 13 | EPSG:4326 &rarr; **EPSG:4326** | Office, Krishi Bhavan, ITI, Padasekharam, Bank, FHC, Hospitals, Stadium, Turf, Shelters |
| **DEM Shaded Relief** | `clippe dem.tif` | Raster | 201&times;155 | EPSG:4326 &rarr; **EPSG:4326** | SRTM 30m DEM (1m to 406m AOD), overlay with opacity slider |
| **Hillshade Relief** | `hill shade.tif` | Raster | 201&times;155 | EPSG:4326 &rarr; **EPSG:4326** | Shaded relief (Azimuth 315°, Alt 45°), opacity slider |
| **Slope Analysis** | `slope kollayil.tif` | Raster | 201&times;155 | EPSG:4326 &rarr; **EPSG:4326** | 0° to 74.1° slope gradient categorized into 5 slope classes |

---

## 3. Official Demographic Profile (Updated 17 March 2026)

*Source: Kerala Local Self Government (Panchayat) Department, reported as updated on 17 March 2026. Note: Census 2011 data has been strictly excluded from this project in accordance with project requirements.*

### 3.1 General Population Statistics
- **Total Population:** 25,077 persons
- **Male Population:** 12,221 (48.73%)
- **Female Population:** 12,856 (51.27%)
- **Total Occupied Households:** 6,529
- **Average Household Size:** Approximately 3.84 persons (25,077 &divide; 6,529 &asymp; 3.84)
- **Population Density:** 1,826.44 persons/km&sup2; (25,077 &divide; 13.73 km&sup2;)
- **Geographical Area:** 13.73 km&sup2;
- **Total Administrative Wards:** 16

### 3.2 Scheduled Caste (SC) Population
- **Total SC Population:** 3,870 persons (15.43% of total population)
- **SC Males:** 1,898 (49.04%)
- **SC Females:** 1,972 (50.96%)

### 3.3 Scheduled Tribe (ST) Population
- **Total ST Population:** 21 persons (0.08% of total population)
- **ST Males:** 7
- **ST Females:** *Not supplied* (Preserved as unreported in official records without interpolation)

### 3.4 Arithmetic Verification
- **Sex Sum:** 12,221 (M) + 12,856 (F) = **25,077** (Exact match)
- **SC Sum:** 1,898 (SC M) + 1,972 (SC F) = **3,870** (Exact match)
- **Household Size:** 25,077 &divide; 6,529 = **3.8415 persons per household**
- **Density:** 25,077 &divide; 13.73 km&sup2; = **1,826.438 persons/km&sup2;**

---

## 4. Official 16-Ward Directory (Supplied Order)

1. **Nadoorkolla** (Host to Kalatharaikkal Padasekharam)
2. **Perumbottukonam**
3. **Mankottukonam**
4. **Malayilkada**
5. **Pankottukonam**
6. **Manchavilakom**
7. **Poovathoor**
8. **Charuvilakom**
9. **Mekolla**
10. **Dhanuvachapuram** (Headquarters, Railway Station, ITI, Krishi Bhavan)
11. **Kottamam**
12. **Puthusserimadam**
13. **Eaithukondakani**
14. **Udiyankulangara** (Arterial junction to NH-66)
15. **Deveswaram**
16. **Panayammoola**

---

## 5. Development Profile of Kollayil Grama Panchayat

- **Sustainable Development (Since 2016):** Execution of the **LIFE Housing Mission** across two distinct phases to provide permanent pucca houses to landless families.
- **Extreme Poverty Eradication:** Survey identified **46 vulnerable families**, supported through targeted micro-plans, leading to a reported *extreme-poverty-free status* (labeled as reported programme information pending independent verification).
- **Women's Empowerment:** Literacy programs, health awareness, personal safety, organic vegetable farming, *Ksheera Samruddhi*, goat rearing, poultry, yoga, and karate self-defense training.
- **Healthcare Upgradation:** Family Health Centre (FHC), Government Homoeo Hospital, and Government Ayurveda Hospital modernization.
- **Sports & Recreation:** Manchavilakom community stadium, Manivila synthetic turf (completed), and Manchavilakom cricket turf (in progress).
- **Rural Transportation:** Launch of the **Gramavandi** village vehicle transit scheme connecting remote unserved hamlets to Dhanuvachapuram.
- **Infrastructure:** Road tarring, road concreting, re-tarring, retaining walls on slopes, and pond embankment masonry walls, cross-linked to the GIS map.
- **Participants in Historical Narrative:** Dr. N. S. Navaneethkumar (Panchayat President), T. A. Johnny (Secretary), V. S. Binu (District Panchayat Member), V. Thanupillai (Block President), K. V. Padmakumar (Block Member), Kudumbashree and Haritha Karma Sena workers (noted as participants in supplied historical narrative, not current officeholders).

---

## 6. Agriculture & Rural Development Profile

- **Featured Agricultural Area:** Kalatharaikkal Padasekharam in Nadurkolla Ward.
- **Cropping Pattern:** Traditional wet rice paddy, mushroom, flowers (sunflowers, marigolds), millets, banana orchards, organic vegetables.
- **Innovative Schemes:** *Haritha Bhavanam* (green homesteads) and *Mazhamara* (rain shelters for monsoon vegetable cultivation).
- **Farm Mechanisation:** Agricultural combine harvester provided to the Agricultural Karma Sena.
- **Livestock Schemes:**
  - Goat-rearing scheme: **56 beneficiaries**
  - Calf-rearing scheme: **22 beneficiaries**
  - Active Milk Cooperative Societies: **3 societies** (reported programme information)

---

## 7. Disaster Management and Environmental Risk Profile

- **Hydrological Inundation:** Analysis of stream orders 1 to 3 draining south-westward towards the Neyyar River basin. *Clarification:* The Neyyar River does not directly flow through or cause riverbank overtopping within Kollayil unless regional backwater flooding occurs.
- **Slope Stability & Soil Erosion:** Screening of slope gradients (0° to 74.1°) and shallow skeletal hill soils, emphasizing terracing and contour bunding.
- **Practical Planning Suggestions:** Annual pre-monsoon de-silting before May 31, preservation of Kalatharaikkal wetland retention capacity, and emergency volunteer training.
- **24/7 Helplines:** National 112, DEOC 1077, Neyyattinkara Taluk Control Room (0471-2222227), Fire 101, Ambulance 108.
- **Designated Relief Shelters:** Dhanuvachapuram HSS (Capacity ~450) and Udiyankulangara Community Hall (Capacity ~300).

---

## 8. How to Run Locally

### Method A: Built-in Python Server
```powershell
cd "C:\Users\DELL\Desktop\Kollayil panchayat WEBGIS AI\Kollayil_Panchayat_WebGIS_AI"
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Method B: Live Server in VS Code / Antigravity IDE
Right-click `index.html` and select **"Open with Live Server"**.
