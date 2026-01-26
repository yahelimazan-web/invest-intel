"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PropertyIntelligence } from "../lib/ukPropertyEngine";
import type { MapProperty } from "./PropertyMap";

// POI type definition
type POIType = "train_station" | "hospital" | "school" | "supermarket" | "park";

// Fix for default marker icon in Leaflet with webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Blue marker for selected property
const SelectedIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green marker for intelligence search result
const IntelligenceIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red marker for POIs
const POIIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

// Orange marker for train stations
const TrainIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

// Violet marker for hospitals
const HospitalIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Google Maps tiles with Hebrew language support (hl=he)
const GOOGLE_MAPS_HEBREW = "https://mt1.google.com/vt/lyrs=m&hl=he&x={x}&y={y}&z={z}";

export type LocationType = "cyprus" | "england";

interface LocationConfig {
  center: [number, number];
  zoom: number;
}

const LOCATIONS: Record<LocationType, LocationConfig> = {
  cyprus: {
    center: [34.917, 33.629],
    zoom: 13,
  },
  england: {
    center: [51.5074, -0.1278], // London center
    zoom: 11,
  },
};

const POI_LABELS: Record<POIType, string> = {
  train_station: "תחנת רכבת",
  hospital: "בית חולים",
  school: "בית ספר",
  supermarket: "סופרמרקט",
  park: "פארק",
};

// Component to handle map view changes
function MapViewController({
  center,
  zoom,
  intelligenceCoords,
}: {
  center: [number, number];
  zoom: number;
  intelligenceCoords: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (intelligenceCoords) {
      map.setView(intelligenceCoords, 14);
    } else {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, intelligenceCoords]);

  return null;
}

// Yellow marker for schools
const SchoolIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

// Get icon for POI type
function getPOIIcon(type: string) {
  switch (type) {
    case "train_station":
    case "train":
    case "metro":
      return TrainIcon;
    case "hospital":
      return HospitalIcon;
    case "school":
      return SchoolIcon;
    default:
      return POIIcon;
  }
}

interface MapContentProps {
  location: LocationType;
  onPropertySelect?: (property: MapProperty) => void;
  selectedPropertyId?: string | null;
  properties: MapProperty[];
  // Intelligence mode
  intelligenceData?: PropertyIntelligence | null;
  onIntelligenceSearch?: (postcode: string) => void;
  isSearchingIntelligence?: boolean;
}

export default function MapContent({
  location,
  onPropertySelect,
  selectedPropertyId,
  properties,
  intelligenceData,
}: MapContentProps) {
  const config = useMemo(() => LOCATIONS[location], [location]);

  // Intelligence coordinates
  const intelligenceCoords: [number, number] | null = intelligenceData
    ? [intelligenceData.coordinates.lat, intelligenceData.coordinates.lon]
    : null;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={config.center}
        zoom={config.zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <MapViewController
          center={config.center}
          zoom={config.zoom}
          intelligenceCoords={intelligenceCoords}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url={GOOGLE_MAPS_HEBREW}
          maxZoom={20}
        />

        {/* Property markers */}
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={property.position}
            icon={selectedPropertyId === property.id ? SelectedIcon : DefaultIcon}
            eventHandlers={{
              click: () => onPropertySelect?.(property),
            }}
          >
            <Popup>
              <div className="property-popup" dir="rtl">
                <h3>{property.title}</h3>
                <p>{property.bedrooms} חדרים, {property.size} מ״ר</p>
                <p>תשואה: {property.grossYield.toFixed(1)}% ברוטו</p>
                <div className="price">
                  {property.currency === "GBP" ? "£" : "€"}
                  {property.price.toLocaleString()}
                </div>
                <button
                  onClick={() => onPropertySelect?.(property)}
                  className="mt-2 w-full text-center text-xs bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  פרטים מלאים
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Intelligence result - marker, circle, and POIs */}
        {intelligenceData && intelligenceCoords && (() => {
          // Handle both old and new data formats
          const address = (intelligenceData as any).physical?.address || 
                         (intelligenceData as any).address || 
                         (intelligenceData as any).postcode || "";
          const councilName = (intelligenceData as any).council?.name || 
                             (intelligenceData as any).councilName || "";
          const region = (intelligenceData as any).council?.region || 
                        (intelligenceData as any).region || "";
          const sqm = (intelligenceData as any).physical?.sqm || 
                     (intelligenceData as any).sqm;
          const avgPrice = (intelligenceData as any).market?.avgSoldPrice || 
                          (intelligenceData as any).marketData?.avgAreaPrice || 0;
          const mode = intelligenceData.mode || "potential";
          
          // Get POIs from new format (proximity) or old format (nearbyPOIs)
          const proximity = (intelligenceData as any).proximity;
          const oldPOIs = (intelligenceData as any).nearbyPOIs || [];
          
          // Build POI markers from new proximity data
          const poiMarkers: Array<{ lat: number; lon: number; name: string; type: string; distance: number }> = [];
          
          if (proximity) {
            // Use actual coordinates if available, otherwise approximate
            const addPOI = (poi: { name: string; distance: number; coordinates?: { lat: number; lon: number } } | null | undefined, type: string) => {
              if (!poi) return;
              
              let lat: number, lon: number;
              if (poi.coordinates) {
                lat = poi.coordinates.lat;
                lon = poi.coordinates.lon;
              } else {
                // Approximate position based on distance
                const angle = Math.random() * 2 * Math.PI;
                const distanceInDegrees = poi.distance / 111000;
                lat = intelligenceCoords[0] + distanceInDegrees * Math.cos(angle);
                lon = intelligenceCoords[1] + distanceInDegrees * Math.sin(angle) / Math.cos(intelligenceCoords[0] * Math.PI / 180);
              }
              
              poiMarkers.push({
                lat,
                lon,
                name: poi.name,
                type,
                distance: poi.distance,
              });
            };
            
            addPOI(proximity.trainStation, "train_station");
            addPOI(proximity.metro, "metro");
            addPOI(proximity.hospital, "hospital");
            addPOI(proximity.university, "university");
            proximity.schools?.forEach((s: any) => addPOI(s, "school"));
            proximity.supermarkets?.forEach((s: any) => addPOI(s, "supermarket"));
          }
          
          // Combine with old format POIs
          const allPOIs = [...poiMarkers, ...oldPOIs].slice(0, 8);
          
          return (
            <>
              {/* 1km radius circle */}
              <Circle
                center={intelligenceCoords}
                radius={1000}
                pathOptions={{
                  color: "#10b981",
                  fillColor: "#10b981",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: "5, 5",
                }}
              />

              {/* Main property marker */}
              <Marker position={intelligenceCoords} icon={IntelligenceIcon}>
                <Popup>
                  <div className="property-popup" dir="rtl">
                    <h3>{address}</h3>
                    <p>{councilName}{region ? `, ${region}` : ""}</p>
                    {sqm && <p>{sqm} מ״ר</p>}
                    <div className="price">
                      £{avgPrice.toLocaleString()}
                    </div>
                    <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      {mode === "existing" ? "נכס קיים - Gold Data" : "נכס פוטנציאלי"}
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* POI markers */}
              {allPOIs.map((poi, idx) => (
                <Marker
                  key={`poi-${idx}`}
                  position={[poi.lat, poi.lon]}
                  icon={getPOIIcon(poi.type)}
                >
                  <Popup>
                    <div className="text-center" dir="rtl">
                      <strong>{poi.name}</strong>
                      <p className="text-sm text-gray-600">
                        {POI_LABELS[poi.type as POIType] || poi.type} • {poi.distance >= 1000
                          ? `${(poi.distance / 1000).toFixed(1)} ק״מ`
                          : `${Math.round(poi.distance)} מטר`}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          );
        })()}
      </MapContainer>
    </div>
  );
}
