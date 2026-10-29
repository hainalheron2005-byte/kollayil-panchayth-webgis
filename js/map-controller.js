/**
 * ============================================================================
 * KOLLAYIL GRAMA PANCHAYAT WEB GIS - MASTER APPLICATION CONTROLLER
 * Developer: HAINA .L. HERON (hainalheron2005@gmail.com)
 * Comprehensive Web GIS Workbench, Leaflet Layer Controller, QGIS Integration,
 * Topographic Analysis, March 2026 Demographic Analytics & Ward Directory
 * ============================================================================
 */

(function () {
  'use strict';

  // Authentic Center and Geographic Bounds of Kollayil Grama Panchayat (EPSG:4326)
  const KOLLAYIL_CENTER = [8.3934, 77.1314];
  const KOLLAYIL_INITIAL_ZOOM = 13;
  const KOLLAYIL_BBOX = [
    [8.37125, 77.10347], // Southwest coordinate
    [8.41431, 77.15931]  // Northeast coordinate
  ];

  // Official 16 Wards in Supplied Order (March 2026 update)
  const OFFICIAL_16_WARDS = [
    { number: 1, name: "Nadoorkolla" },
    { number: 2, name: "Perumbottukonam" },
    { number: 3, name: "Mankottukonam" },
    { number: 4, name: "Malayilkada" },
    { number: 5, name: "Pankottukonam" },
    { number: 6, name: "Manchavilakom" },
    { number: 7, name: "Poovathoor" },
    { number: 8, name: "Charuvilakom" },
    { number: 9, name: "Mekolla" },
    { number: 10, name: "Dhanuvachapuram" },
    { number: 11, name: "Kottamam" },
    { number: 12, name: "Puthusserimadam" },
    { number: 13, name: "Eaithukondakani" },
    { number: 14, name: "Udiyankulangara" },
    { number: 15, name: "Deveswaram" },
    { number: 16, name: "Panayammoola" }
  ];

  // Global Application State
  const AppState = {
    map: null,
    baseLayers: {},
    activeBaseLayer: null,
    overlayLayers: {
      wards: null,
      drainage: null,
      roads: null,
      soil: null,
      contours: null,
      geology: null,
      geomorphology: null,
      facilities: null
    },
    rasterLayers: {
      dem: null,
      hillshade: null,
      slope: null
    },
    loadedData: {
      wards: null,
      drainage: null,
      roads: null,
      soil: null,
      contours: null,
      geology: null,
      geomorphology: null,
      facilities: null
    },
    searchIndex: [],
    charts: {
      generalSexChart: null,
      scSexChart: null,
      stPopChart: null,
      demographicMetricsChart: null
    }
  };

  /**
   * Initialize Application on DOM Ready
   */
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMap();
    initRasterOverlays();
    initLayerControls();
    initSearch();
    initLocalFileUpload();
    initWardDirectory();
    initDemographicCharts();
    loadAllGeoJSONDatasets();
  });

  /**
   * Navigation Bar Mobile Toggle & Smooth Scrolling
   */
  function initNavigation() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');

    if (menuBtn && mainNav) {
      menuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
      });
    }

    document.querySelectorAll('.main-navigation a').forEach(link => {
      link.addEventListener('click', () => {
        if (mainNav && mainNav.classList.contains('active')) {
          mainNav.classList.remove('active');
        }
      });
    });
  }

  /**
   * Initialize Leaflet Map Instance with Layer Stacking Panes
   */
  function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Create Leaflet Map Instance
    const map = L.map('map', {
      center: KOLLAYIL_CENTER,
      zoom: KOLLAYIL_INITIAL_ZOOM,
      zoomControl: false,
      attributionControl: true
    });

    AppState.map = map;

    // Custom Map Panes for Cartographic Stacking Order:
    // 1. Rasters Pane (DEM, Hillshade, Slope) -> zIndex 350
    // 2. Polygons Pane (Geology, Geomorphology, Soil) -> zIndex 400
    // 3. Boundaries Pane (Wards) -> zIndex 450
    // 4. Lines Pane (Roads, Drainage, Contours) -> zIndex 500
    // 5. Facilities / Points Pane -> zIndex 600
    map.createPane('rastersPane');
    map.getPane('rastersPane').style.zIndex = 350;

    map.createPane('polygonsPane');
    map.getPane('polygonsPane').style.zIndex = 400;

    map.createPane('boundariesPane');
    map.getPane('boundariesPane').style.zIndex = 450;

    map.createPane('linesPane');
    map.getPane('linesPane').style.zIndex = 500;

    map.createPane('pointsPane');
    map.getPane('pointsPane').style.zIndex = 600;

    // Add Zoom Control to Top-Right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add Metric Scale Bar to Bottom-Left
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false,
      maxWidth: 150
    }).addTo(map);

    // Setup Base Maps (OpenStreetMap, Esri Imagery, OpenTopoMap)
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    });

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
    });

    const topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM'
    });

    AppState.baseLayers = {
      osm: osm,
      satellite: esriSatellite,
      topo: topoMap
    };

    // Default to OpenStreetMap
    osm.addTo(map);
    AppState.activeBaseLayer = osm;

    // Base Map Selector UI Event
    const basemapSelect = document.getElementById('basemapSelect');
    if (basemapSelect) {
      basemapSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (AppState.activeBaseLayer) {
          map.removeLayer(AppState.activeBaseLayer);
        }
        if (AppState.baseLayers[selected]) {
          AppState.baseLayers[selected].addTo(map);
          AppState.activeBaseLayer = AppState.baseLayers[selected];
        }
      });
    }

    // Mouse Move Coordinates Tracking
    const coordsDisplay = document.getElementById('coordsDisplay');
    const zoomDisplay = document.getElementById('zoomDisplay');

    map.on('mousemove', (e) => {
      if (coordsDisplay) {
        coordsDisplay.textContent = `Lat: ${e.latlng.lat.toFixed(5)}° N, Lng: ${e.latlng.lng.toFixed(5)}° E`;
      }
    });

    map.on('zoomend', () => {
      if (zoomDisplay) {
        zoomDisplay.textContent = `Zoom: ${map.getZoom()}`;
      }
    });

    // Reset Extent Button
    const resetBtn = document.getElementById('btnResetExtent');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetMapView();
      });
    }

    // Fullscreen Toggle Button
    const fullScreenBtn = document.getElementById('btnFullScreen');
    if (fullScreenBtn) {
      fullScreenBtn.addEventListener('click', () => {
        const mapContainer = document.querySelector('.gis-workbench');
        if (!document.fullscreenElement) {
          if (mapContainer && mapContainer.requestFullscreen) {
            mapContainer.requestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    }

    updateStatusOverlay(
      'Loading QGIS layers: Wards, Drainage, Roads, Soil, Contours, Geology, Geomorphology, and Public Facilities...',
      'info'
    );
  }

  /**
   * Initialize High-Resolution Digital Terrain Raster Overlays (DEM, Hillshade, Slope)
   */
  function initRasterOverlays() {
    if (!AppState.map) return;

    // Create Leaflet ImageOverlays with exact geographic bounds
    const demOverlay = L.imageOverlay('./assets/images/terrain/dem-relief.png', KOLLAYIL_BBOX, {
      pane: 'rastersPane',
      opacity: 0.75,
      interactive: false
    });

    const hillshadeOverlay = L.imageOverlay('./assets/images/terrain/hillshade.png', KOLLAYIL_BBOX, {
      pane: 'rastersPane',
      opacity: 0.65,
      interactive: false
    });

    const slopeOverlay = L.imageOverlay('./assets/images/terrain/slope.png', KOLLAYIL_BBOX, {
      pane: 'rastersPane',
      opacity: 0.70,
      interactive: false
    });

    AppState.rasterLayers.dem = demOverlay;
    AppState.rasterLayers.hillshade = hillshadeOverlay;
    AppState.rasterLayers.slope = slopeOverlay;

    // Checkbox and Opacity Slider Handlers
    setupRasterControl('chkRasterDem', 'opacityDem', 'opacityDemVal', demOverlay);
    setupRasterControl('chkRasterHillshade', 'opacityHillshade', 'opacityHillshadeVal', hillshadeOverlay);
    setupRasterControl('chkRasterSlope', 'opacitySlope', 'opacitySlopeVal', slopeOverlay);
  }

  function setupRasterControl(checkboxId, sliderId, labelValId, overlay) {
    const chk = document.getElementById(checkboxId);
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelValId);

    if (chk) {
      chk.addEventListener('change', (e) => {
        if (!AppState.map) return;
        if (e.target.checked) {
          overlay.addTo(AppState.map);
        } else {
          AppState.map.removeLayer(overlay);
        }
      });
    }

    if (slider && label) {
      slider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        label.textContent = `${val}%`;
        overlay.setOpacity(val / 100);
      });
    }
  }

  /**
   * Reset map to default bounds or loaded spatial layers
   */
  function resetMapView() {
    if (!AppState.map) return;

    if (AppState.overlayLayers.wards && AppState.overlayLayers.wards.getLayers().length > 0) {
      AppState.map.fitBounds(AppState.overlayLayers.wards.getBounds(), { padding: [20, 20] });
    } else {
      AppState.map.setView(KOLLAYIL_CENTER, KOLLAYIL_INITIAL_ZOOM);
    }
  }

  /**
   * Setup UI Vector Layer Checkboxes
   */
  function initLayerControls() {
    setupLayerCheckbox('chkLayerWards', 'wards');
    setupLayerCheckbox('chkLayerDrainage', 'drainage');
    setupLayerCheckbox('chkLayerRoads', 'roads');
    setupLayerCheckbox('chkLayerSoil', 'soil');
    setupLayerCheckbox('chkLayerContours', 'contours');
    setupLayerCheckbox('chkLayerGeology', 'geology');
    setupLayerCheckbox('chkLayerGeomorphology', 'geomorphology');
    setupLayerCheckbox('chkLayerFacilities', 'facilities');
  }

  function setupLayerCheckbox(checkboxId, layerKey) {
    const chk = document.getElementById(checkboxId);
    if (!chk) return;

    chk.addEventListener('change', (e) => {
      const layer = AppState.overlayLayers[layerKey];
      if (!layer || !AppState.map) return;

      if (e.target.checked) {
        if (!AppState.map.hasLayer(layer)) {
          AppState.map.addLayer(layer);
        }
      } else {
        if (AppState.map.hasLayer(layer)) {
          AppState.map.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Update Notification Banner on the Map
   */
  function updateStatusOverlay(message, type = 'info') {
    const overlay = document.getElementById('mapStatusOverlay');
    if (!overlay) return;

    overlay.className = `map-status-overlay status-${type}`;
    overlay.innerHTML = `
      <span>${type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <div>${message}</div>
    `;
    overlay.style.display = 'flex';
  }

  /**
   * Load All GeoJSON Datasets
   */
  async function loadAllGeoJSONDatasets() {
    const datasets = [
      { key: 'wards', url: './data/kollayil-wards.geojson', countBadge: 'countWards' },
      { key: 'drainage', url: './data/drainage.geojson', countBadge: 'countDrainage' },
      { key: 'roads', url: './data/roads.geojson', countBadge: 'countRoads' },
      { key: 'soil', url: './data/soil.geojson', countBadge: 'countSoil' },
      { key: 'contours', url: './data/contours.geojson', countBadge: 'countContours' },
      { key: 'geology', url: './data/geology.geojson', countBadge: 'countGeology' },
      { key: 'geomorphology', url: './data/geomorphology.geojson', countBadge: 'countGeomorphology' },
      { key: 'facilities', url: './data/facilities.geojson', countBadge: 'countFacilities' }
    ];

    let anyValidFeaturesLoaded = false;
    let loadedLayersSummary = [];

    for (const item of datasets) {
      try {
        const response = await fetch(item.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const geojsonData = await response.json();
        const featureCount = processGeoJSONLayer(item.key, geojsonData);

        const badge = document.getElementById(item.countBadge);
        if (badge) {
          badge.textContent = `${featureCount} features`;
          if (featureCount > 0) {
            badge.style.backgroundColor = '#d8f3dc';
            badge.style.color = '#1b4332';
          }
        }

        if (featureCount > 0) {
          anyValidFeaturesLoaded = true;
          loadedLayersSummary.push(`${item.key} (${featureCount})`);
        }
      } catch (err) {
        console.warn(`Layer [${item.key}] not loaded from ${item.url}:`, err.message);
        const badge = document.getElementById(item.countBadge);
        if (badge) {
          badge.textContent = '0 features';
        }
      }
    }

    if (anyValidFeaturesLoaded) {
      updateStatusOverlay(
        `Verified QGIS layers loaded: ${loadedLayersSummary.join(', ')}.`,
        'success'
      );
      if (AppState.overlayLayers.wards && AppState.overlayLayers.wards.getLayers().length > 0) {
        AppState.map.fitBounds(AppState.overlayLayers.wards.getBounds(), { padding: [15, 15] });
      }
    } else {
      updateStatusOverlay(
        'Initial View Mode: Awaiting QGIS vector exports in data/ folder.',
        'warning'
      );
    }
  }

  /**
   * Process & Style GeoJSON Data Dynamically with Custom Map Panes
   */
  function processGeoJSONLayer(layerKey, geojsonData) {
    if (!geojsonData || !geojsonData.features || !Array.isArray(geojsonData.features)) {
      return 0;
    }

    const featureCount = geojsonData.features.length;
    if (featureCount === 0) {
      return 0;
    }

    AppState.loadedData[layerKey] = geojsonData;

    if (AppState.overlayLayers[layerKey] && AppState.map) {
      AppState.map.removeLayer(AppState.overlayLayers[layerKey]);
    }

    const paneName = getLayerPane(layerKey);

    const newLayer = L.geoJSON(geojsonData, {
      pane: paneName,
      style: (feature) => getLayerFeatureStyle(layerKey, feature),
      pointToLayer: (feature, latlng) => createPointMarker(layerKey, feature, latlng),
      onEachFeature: (feature, layer) => setupFeatureInteractivity(layerKey, feature, layer)
    });

    AppState.overlayLayers[layerKey] = newLayer;

    // Add to map if checkbox is checked
    const chk = document.getElementById(`chkLayer${layerKey.charAt(0).toUpperCase() + layerKey.slice(1)}`);
    if (chk && chk.checked && AppState.map) {
      newLayer.addTo(AppState.map);
    }

    // Index features for Search
    indexFeaturesForSearch(layerKey, geojsonData);

    return featureCount;
  }

  /**
   * Map Panes for Clean Stacking Order
   */
  function getLayerPane(layerKey) {
    switch (layerKey) {
      case 'geology':
      case 'geomorphology':
      case 'soil':
        return 'polygonsPane';
      case 'wards':
        return 'boundariesPane';
      case 'drainage':
      case 'roads':
      case 'contours':
        return 'linesPane';
      case 'facilities':
        return 'pointsPane';
      default:
        return 'overlayPane';
    }
  }

  /**
   * Distinct Cartographic Symbology per Layer
   */
  function getLayerFeatureStyle(layerKey, feature) {
    const props = feature.properties || {};

    switch (layerKey) {
      // 1. DRAINAGE NETWORK: Hydro-blue line hierarchy
      case 'drainage': {
        const order = Number(props.ORDER1) || 1;
        const lineWeight = order === 1 ? 1.6 : order === 2 ? 2.5 : 3.6;
        return {
          color: '#0284c7',
          weight: lineWeight,
          opacity: 0.95
        };
      }

      // 2. ROAD NETWORK: Terracotta / amber roadway styling
      case 'roads':
        return {
          color: '#ea580c',
          weight: 2.6,
          opacity: 0.92
        };

      // 3. SOIL TYPES: Authentic red soil vs hill soil fills
      case 'soil': {
        const soilName = String(props.SOIL || '').toLowerCase();
        let fillColor = '#ef4444'; // Red Soil
        let strokeColor = '#b91c1c';
        if (soilName.includes('hill')) {
          fillColor = '#b45309'; // Hill Soil Amber Brown
          strokeColor = '#78350f';
        }
        return {
          fillColor: fillColor,
          color: strokeColor,
          weight: 1.8,
          opacity: 0.85,
          fillOpacity: 0.38
        };
      }

      // 4. CONTOURS (10m interval): Ochre/brown elevation isolines
      case 'contours': {
        const elev = Number(props.ELEV) || 0;
        const isIndexContour = (elev % 50 === 0);
        return {
          color: isIndexContour ? '#713f12' : '#a16207',
          weight: isIndexContour ? 2.0 : 1.1,
          opacity: 0.85
        };
      }

      // 5. GEOLOGY: Lithology classification
      case 'geology': {
        const rockName = String(props.NAME || props.ROCK_GROUP || '').toLowerCase();
        let fillColor = '#8b5cf6';
        let strokeColor = '#6d28d9';

        if (rockName.includes('khondalite')) {
          fillColor = '#c084fc';
          strokeColor = '#7e22ce';
        } else if (rockName.includes('charnockite')) {
          fillColor = '#ec4899';
          strokeColor = '#be185d';
        } else if (rockName.includes('migmatite')) {
          fillColor = '#6366f1';
          strokeColor = '#4338ca';
        }

        return {
          fillColor: fillColor,
          color: strokeColor,
          weight: 1.5,
          opacity: 0.85,
          fillOpacity: 0.35
        };
      }

      // 6. GEOMORPHOLOGY: Landform classification
      case 'geomorphology': {
        const landform = String(props.NAME || props.TYPE1 || '').toLowerCase();
        let fillColor = '#eab308';
        let strokeColor = '#a16207';

        if (landform.includes('plateau')) {
          fillColor = '#eab308';
          strokeColor = '#a16207';
        } else if (landform.includes('valley')) {
          fillColor = '#10b981';
          strokeColor = '#047857';
        } else if (landform.includes('water')) {
          fillColor = '#06b6d4';
          strokeColor = '#0891b2';
        } else if (landform.includes('ridge')) {
          fillColor = '#d97706';
          strokeColor = '#92400e';
        }

        return {
          fillColor: fillColor,
          color: strokeColor,
          weight: 1.5,
          opacity: 0.85,
          fillOpacity: 0.35
        };
      }

      // 7. WARD BOUNDARIES: Clean boundary outlines
      case 'wards':
        return {
          color: '#065f46',
          weight: 2.2,
          opacity: 0.95,
          fillColor: '#10b981',
          fillOpacity: 0.12
        };

      default:
        return {
          color: '#475569',
          weight: 1.5,
          opacity: 0.7,
          fillColor: '#94a3b8',
          fillOpacity: 0.2
        };
    }
  }

  /**
   * Point Feature Styling (Facilities / Shelters)
   */
  function createPointMarker(layerKey, feature, latlng) {
    const props = feature.properties || {};
    let markerColor = '#8b5cf6';
    let borderColor = '#ffffff';

    if (props.category && props.category.includes('Headquarters')) {
      markerColor = '#1b4332'; // Deep Green for Panchayat Office
    } else if (props.category && props.category.includes('Agricultural')) {
      markerColor = '#15803d'; // Green for Krishi Bhavan / Farm
    } else if (props.category && props.category.includes('Relief Shelter')) {
      markerColor = '#dc2626'; // Red for Disaster Shelter
    } else if (props.category && props.category.includes('Health')) {
      markerColor = '#0284c7'; // Blue for Health Centre
    } else if (props.category && props.category.includes('Sports')) {
      markerColor = '#ea580c'; // Terracotta for Sports Turf / Stadium
    } else if (props.category && props.category.includes('Dairy')) {
      markerColor = '#d97706'; // Golden amber for Milk Cooperatives
    }

    return L.circleMarker(latlng, {
      pane: 'pointsPane',
      radius: 7,
      fillColor: markerColor,
      color: borderColor,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });
  }

  /**
   * Feature Interaction, Tooltips & Dynamic Attribute Popups
   */
  function setupFeatureInteractivity(layerKey, feature, layer) {
    const props = feature.properties || {};

    let tooltipText = '';
    let popupTitle = '';

    if (layerKey === 'wards') {
      tooltipText = `Ward ${props.ward_no}: ${props.ward_name}`;
      popupTitle = `Ward ${props.ward_no}: ${props.ward_name}`;
    } else if (layerKey === 'drainage') {
      tooltipText = `Stream (Order ${props.ORDER1 || 1})`;
      popupTitle = `Drainage Channel (Order ${props.ORDER1 || 1})`;
    } else if (layerKey === 'roads') {
      tooltipText = props.NAME || 'Road Segment';
      popupTitle = props.NAME || 'Road Segment';
    } else if (layerKey === 'soil') {
      tooltipText = `Soil: ${props.SOIL || 'Series'}`;
      popupTitle = `Soil Classification: ${props.SOIL}`;
    } else if (layerKey === 'contours') {
      tooltipText = `Contour: ${props.ELEV} m`;
      popupTitle = `Topographic Contour: ${props.ELEV} m AOD`;
    } else if (layerKey === 'geology') {
      tooltipText = props.NAME || props.ROCK_GROUP;
      popupTitle = `Geology: ${props.NAME || props.ROCK_GROUP}`;
    } else if (layerKey === 'geomorphology') {
      tooltipText = props.NAME || props.TYPE1;
      popupTitle = `Geomorphology: ${props.NAME}`;
    } else if (layerKey === 'facilities') {
      tooltipText = props.name || 'Public Facility';
      popupTitle = props.name || 'Public Facility';
    } else {
      tooltipText = detectLikelyNameAttribute(props) ? props[detectLikelyNameAttribute(props)] : 'Feature';
      popupTitle = tooltipText;
    }

    // Attach Hover Tooltip
    if (tooltipText && layer.bindTooltip) {
      layer.bindTooltip(String(tooltipText), {
        permanent: false,
        direction: layerKey === 'wards' ? 'center' : 'auto',
        className: 'ward-polygon-tooltip'
      });
    }

    // Hover Highlight Effects
    if (layer.setStyle) {
      layer.on('mouseover', () => {
        layer.setStyle({
          weight: layerKey === 'drainage' || layerKey === 'roads' || layerKey === 'contours' ? 3.8 : 3,
          color: '#d97706',
          fillOpacity: 0.55
        });
      });

      layer.on('mouseout', () => {
        if (AppState.overlayLayers[layerKey]) {
          AppState.overlayLayers[layerKey].resetStyle(layer);
        }
      });
    }

    // Dynamic Popups with all Attribute Table Values
    const popupHtml = buildDynamicAttributePopup(layerKey, popupTitle, props);
    layer.bindPopup(popupHtml, { className: 'custom-gis-popup' });
  }

  function detectLikelyNameAttribute(properties) {
    if (!properties || typeof properties !== 'object') return null;

    const candidateKeys = [
      'ward_name', 'wardname', 'ward_no', 'wardno', 'name', 'soil', 'elev',
      'rock_group', 'type1', 'panchayat', 'facility_name'
    ];

    const keys = Object.keys(properties);
    for (const candidate of candidateKeys) {
      const match = keys.find(k => k.toLowerCase() === candidate);
      if (match && properties[match] !== undefined && properties[match] !== null && String(properties[match]).trim() !== '') {
        return match;
      }
    }

    const nameMatch = keys.find(k => k.toLowerCase().includes('name'));
    if (nameMatch && properties[nameMatch]) return nameMatch;

    return keys.length > 0 ? keys[0] : null;
  }

  /**
   * Build Rich Popup Table from Dynamic Attributes
   */
  function buildDynamicAttributePopup(layerKey, title, properties) {
    const keys = Object.keys(properties || {});
    let rowsHtml = '';

    if (keys.length === 0) {
      rowsHtml = '<tr><td colspan="2" class="popup-val">No additional attributes available.</td></tr>';
    } else {
      keys.forEach(k => {
        const val = properties[k];
        const displayVal = (val !== null && val !== undefined) ? String(val) : '<em>null</em>';
        rowsHtml += `
          <tr>
            <td class="popup-key">${formatAttributeLabel(k)}</td>
            <td class="popup-val">${displayVal}</td>
          </tr>
        `;
      });
    }

    return `
      <div class="popup-wrapper">
        <div class="popup-header">
          <span>${title}</span>
        </div>
        <table class="popup-table">
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  function formatAttributeLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Build Search Index for Available Features
   */
  function indexFeaturesForSearch(layerKey, geojsonData) {
    if (!geojsonData || !geojsonData.features) return;

    geojsonData.features.forEach((feature, idx) => {
      const props = feature.properties || {};
      let searchTitle = '';

      if (layerKey === 'wards') {
        searchTitle = `Ward ${props.ward_no}: ${props.ward_name}`;
      } else if (layerKey === 'roads' && props.NAME) {
        searchTitle = props.NAME;
      } else if (layerKey === 'soil' && props.SOIL) {
        searchTitle = `${props.SOIL} (Soil Classification)`;
      } else if (layerKey === 'contours' && props.ELEV !== undefined) {
        searchTitle = `Contour ${props.ELEV} m AOD`;
      } else if (layerKey === 'geology' && props.NAME) {
        searchTitle = `${props.NAME} (${props.ROCK_GROUP || 'Geology'})`;
      } else if (layerKey === 'geomorphology' && props.NAME) {
        searchTitle = `${props.NAME} (${props.TYPE1 || 'Landform'})`;
      } else if (layerKey === 'facilities' && props.name) {
        searchTitle = `${props.name} (${props.category || 'Facility'})`;
      } else if (layerKey === 'drainage') {
        searchTitle = `Drainage Channel Order ${props.ORDER1 || 1}`;
      } else {
        const nameKey = detectLikelyNameAttribute(props);
        if (nameKey && props[nameKey]) searchTitle = String(props[nameKey]);
      }

      if (searchTitle) {
        AppState.searchIndex.push({
          title: searchTitle,
          layerKey: layerKey,
          featureIndex: idx,
          feature: feature,
          properties: props
        });
      }
    });
  }

  /**
   * Live Search Functionality
   */
  function initSearch() {
    const searchInput = document.getElementById('gisSearchInput');
    const dropdown = document.getElementById('searchResultsDropdown');
    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query || query.length < 2) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
      }

      const matches = AppState.searchIndex.filter(item =>
        item.title.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        dropdown.innerHTML = `<div class="search-item" style="color:#64748b;">No matches found for "${query}"</div>`;
        dropdown.style.display = 'block';
        return;
      }

      let resultsHtml = '';
      matches.slice(0, 10).forEach(item => {
        let badgeColor = '#475569';
        if (item.layerKey === 'wards') badgeColor = '#15803d';
        else if (item.layerKey === 'soil') badgeColor = '#b45309';
        else if (item.layerKey === 'facilities') badgeColor = '#7c3aed';
        else if (item.layerKey === 'drainage') badgeColor = '#0284c7';
        else if (item.layerKey === 'roads') badgeColor = '#ea580c';

        resultsHtml += `
          <div class="search-item" data-title="${encodeURIComponent(item.title)}">
            <strong>${item.title}</strong>
            <span class="badge-tag" style="background:${badgeColor};">${item.layerKey}</span>
          </div>
        `;
      });

      dropdown.innerHTML = resultsHtml;
      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => {
          const title = decodeURIComponent(el.getAttribute('data-title'));
          const found = AppState.searchIndex.find(i => i.title === title);
          if (found && found.feature && AppState.map) {
            zoomToFeature(found.feature);
            dropdown.style.display = 'none';
            searchInput.value = title;
          }
        });
      });
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  function zoomToFeature(feature) {
    if (!AppState.map || !feature) return;

    const tempLayer = L.geoJSON(feature);
    const bounds = tempLayer.getBounds();

    if (bounds.isValid()) {
      AppState.map.fitBounds(bounds, { maxZoom: 16, padding: [40, 40] });
    }
  }

  /**
   * Ward Directory Rendering & Interactive Map Zoom Trigger
   */
  function initWardDirectory() {
    const grid = document.getElementById('wardsDirectoryGrid');
    const searchInput = document.getElementById('wardSearchInput');
    const filterCount = document.getElementById('wardFilterCount');
    if (!grid) return;

    function renderWards(filterText = '') {
      grid.innerHTML = '';
      const filterLower = filterText.toLowerCase();

      const filtered = OFFICIAL_16_WARDS.filter(w =>
        w.name.toLowerCase().includes(filterLower) || String(w.number).includes(filterLower)
      );

      if (filterCount) {
        filterCount.textContent = filtered.length;
      }

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-muted); padding:1rem;">No wards match your search query.</div>';
        return;
      }

      filtered.forEach(ward => {
        const card = document.createElement('div');
        card.className = 'ward-card';
        card.innerHTML = `
          <div class="ward-card-info">
            <span class="ward-number-badge">Ward ${ward.number}</span>
            <span class="ward-title">${ward.name}</span>
          </div>
          <button class="ward-locate-btn" data-ward-no="${ward.number}" data-ward-name="${ward.name}">
            <span>📍</span> View on Map
          </button>
        `;
        grid.appendChild(card);
      });

      // Attach button click events to navigate directly to map
      grid.querySelectorAll('.ward-locate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const wardNo = btn.getAttribute('data-ward-no');
          const wardName = btn.getAttribute('data-ward-name');
          locateWardOnMap(wardNo, wardName);
        });
      });
    }

    renderWards();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderWards(e.target.value.trim());
      });
    }
  }

  /**
   * Locate & Highlight Ward on the Leaflet Map
   */
  function locateWardOnMap(wardNo, wardName) {
    if (!AppState.map) return;

    const mapSection = document.getElementById('webgis');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Ensure wards layer is toggled on
    const chkWards = document.getElementById('chkLayerWards');
    if (chkWards && !chkWards.checked) {
      chkWards.checked = true;
      if (AppState.overlayLayers.wards && !AppState.map.hasLayer(AppState.overlayLayers.wards)) {
        AppState.overlayLayers.wards.addTo(AppState.map);
      }
    }

    // Search for feature in loaded wards GeoJSON
    if (AppState.loadedData.wards && AppState.loadedData.wards.features) {
      const match = AppState.loadedData.wards.features.find(f => {
        const props = f.properties || {};
        const pNo = String(props.ward_no || '');
        const pName = String(props.ward_name || '').toLowerCase();
        return pNo === String(wardNo) || pName.includes(wardName.toLowerCase());
      });

      if (match) {
        zoomToFeature(match);
        updateStatusOverlay(`Focused on Ward ${wardNo}: ${wardName}`, 'success');
        return;
      }
    }

    // Fallback: Default map center view with notification
    AppState.map.setView(KOLLAYIL_CENTER, 14);
    updateStatusOverlay(`Ward ${wardNo}: ${wardName} selected. Spatial polygon boundary pending micro-cadastral verification.`, 'info');
  }

  /**
   * Direct Browser File Upload Tester
   */
  function initLocalFileUpload() {
    const fileInput = document.getElementById('localGeoJsonInput');
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const detectedKey = determineLayerTypeFromFilename(file.name);
          const count = processGeoJSONLayer(detectedKey, parsed);

          updateStatusOverlay(
            `Successfully loaded ${count} features directly from ${file.name} as [${detectedKey}].`,
            'success'
          );

          if (AppState.overlayLayers[detectedKey]) {
            AppState.map.fitBounds(AppState.overlayLayers[detectedKey].getBounds());
          }
        } catch (err) {
          alert(`Error parsing GeoJSON file: ${err.message}`);
        }
      };

      reader.readAsText(file);
    });
  }

  function determineLayerTypeFromFilename(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('drainage') || lower.includes('stream') || lower.includes('river')) return 'drainage';
    if (lower.includes('road')) return 'roads';
    if (lower.includes('soil')) return 'soil';
    if (lower.includes('contour')) return 'contours';
    if (lower.includes('geology') || lower.includes('rock')) return 'geology';
    if (lower.includes('geomorph')) return 'geomorphology';
    if (lower.includes('facility') || lower.includes('shelter')) return 'facilities';
    return 'wards';
  }

  /**
   * Initialize Dynamic Demographic Charts (Updated 17 March 2026)
   */
  function initDemographicCharts() {
    if (typeof Chart === 'undefined') return;

    // CHART A: General Population by Sex
    const canvasA = document.getElementById('chartGeneralSex');
    if (canvasA) {
      const ctxA = canvasA.getContext('2d');
      AppState.charts.generalSexChart = new Chart(ctxA, {
        type: 'doughnut',
        data: {
          labels: ['Male Population (12,221)', 'Female Population (12,856)'],
          datasets: [{
            data: [12221, 12856],
            backgroundColor: ['#0284c7', '#d97706'],
            borderColor: ['#0369a1', '#b45309'],
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = 25077;
                  const val = context.raw;
                  const pct = ((val / total) * 100).toFixed(2);
                  return ` ${context.label}: ${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // CHART B: Scheduled Caste Population by Sex
    const canvasB = document.getElementById('chartScSex');
    if (canvasB) {
      const ctxB = canvasB.getContext('2d');
      AppState.charts.scSexChart = new Chart(ctxB, {
        type: 'pie',
        data: {
          labels: ['SC Males (1,898)', 'SC Females (1,972)'],
          datasets: [{
            data: [1898, 1972],
            backgroundColor: ['#6366f1', '#ec4899'],
            borderColor: ['#4f46e5', '#db2777'],
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const totalSC = 3870;
                  const val = context.raw;
                  const pct = ((val / totalSC) * 100).toFixed(2);
                  return ` ${context.label}: ${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // CHART C: Scheduled Tribe Population Breakdown
    const canvasC = document.getElementById('chartStPopulation');
    if (canvasC) {
      const ctxC = canvasC.getContext('2d');
      AppState.charts.stPopChart = new Chart(ctxC, {
        type: 'bar',
        data: {
          labels: ['Total ST Population', 'ST Males', 'ST Females (Not Supplied)'],
          datasets: [{
            label: 'Reported Persons',
            data: [21, 7, 0],
            backgroundColor: ['#16a34a', '#2563eb', '#cbd5e1'],
            borderColor: ['#15803d', '#1d4ed8', '#94a3b8'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (context.dataIndex === 2) {
                    return ' ST Females: Not supplied in official record';
                  }
                  return ` Persons: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 5 },
              title: { display: true, text: 'Persons' }
            }
          }
        }
      });
    }

    // CHART D: Demographic & Household Distribution Indicators
    const canvasD = document.getElementById('chartDemographicMetrics');
    if (canvasD) {
      const ctxD = canvasD.getContext('2d');
      AppState.charts.demographicMetricsChart = new Chart(ctxD, {
        type: 'bar',
        data: {
          labels: ['Population (x10)', 'Households', 'Density (persons/km²)'],
          datasets: [{
            label: 'Demographic Factors',
            data: [2507.7, 6529, 1826.44],
            backgroundColor: ['#1b4332', '#0284c7', '#d97706'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (context.dataIndex === 0) return ' Total Population: 25,077 persons';
                  if (context.dataIndex === 1) return ' Total Households: 6,529 (Avg 3.84 persons/household)';
                  if (context.dataIndex === 2) return ' Population Density: 1,826.44 persons/km² (Area: 13.73 km²)';
                  return `${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Numerical Value' }
            }
          }
        }
      });
    }
  }

})();
